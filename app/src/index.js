// css IMPORT 부분
import "./app.css";

// Import 라이브러리
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});
import ecommerce_store_artifacts from "../../build/contracts/EcommerceStore.json";



// 스마트 계약을 사용할 수 있는 객체를 생성합니다.

var EcommerceStore = contract(ecommerce_store_artifacts);

var reader;

console.log(EcommerceStore)
window.App = {
 start: function() {
 
  var self = this;
  EcommerceStore.setProvider(window.ethereum);

  if($("#product-details").length > 0) {
    let productId = new URLSearchParams(window.location.search).get('id');
    renderProductDetails(productId);
  } else {
    renderStore();
  }

  $("#product-image").change(function(event) {
    const file = event.target.files[0]
    reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
  });
  
  $("#add-item-to-store").submit(function(event) {
    alert('111')
    const req = $("#add-item-to-store").serialize();
    let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') +
    '"}');
   
    let decodedParams = {}
    
    Object.keys(params).forEach(function(v){
      decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
    }); 
    console.log(decodedParams);
    saveProduct(decodedParams);
    //페이지 자동 새로고침 방지
    event.preventDefault();
  });



  $("#buy-now").submit(function(event) {
    $("#msg").hide();
    
    web3.eth.requestAccounts().then(function(accounts) {
        var account = accounts[0]; // Ethereum 계정에서 첫 번째 주소 가져오기
        
        if (typeof account === 'undefined') {
            alert("계정을 찾을 수 없습니다. MetaMask를 확인하세요.");
            return;
        }
        
        var sendAmount = $("#buy-now-price").val();
        var productId = $("#product-id").val();
        
        EcommerceStore.deployed().then(function(f) {
          alert('들어옴');
            f.buy(productId, { value: sendAmount, from: account, gas: 880000 }).then(function(f) {
                $("#msg").show();
                $("#msg").html("제품을 성공적으로 구입했습니다!");
            }).catch(function(error) {
                console.error("트랜잭션 오류:", error);
            });
        });
        
    });
    
    event.preventDefault();
});

  
  $("#release-funds").click(function(event) {
    web3.eth.requestAccounts().then(function(accounts) {
    var account = accounts[0]; 
    let productId = new URLSearchParams(window.location.search).get('id');
    EcommerceStore.deployed().then(function(f) {
      $("#msg").html("submitted").show();
      console.log(productId);
      f.releaseAmountToSeller(productId, {from: account}).then(function(f) {
        console.log(f);
        location.reload();
      }).catch(function(e) {
       console.log(e);
      })
    });
  });
  });

  $("#refund-funds").click(function(event) {
    web3.eth.requestAccounts().then(function(accounts) {
    var account = accounts[0];
    let productId = new URLSearchParams(window.location.search).get('id');
    EcommerceStore.deployed().then(function(f) {
      $("#msg").html("submitted").show();
      console.log(productId);
      f.refundAmountToBuyer(productId, {from: account}).then(function(f) {
        console.log(f);
        location.reload();
      }).catch(function(e) {
       console.log(e);
      })
  });
});
});
  



  //$("#buy-now").submit(function(event) {
  //  $("#msg").hide();
  //  var account
  //  var sendAmount = $("#buy-now-price").val();
  //  var productId = $("#product-id").val();

    //web3.eth.requestAccounts().then(function(accounts) {

    //account = accounts[0];
  //  EcommerceStore.deployed().then(function(i) {
  //   alert('들어옴');
  //    alert(productId);
  //    i.buy(productId, {value: sendAmount, from: account, gas: 44000}).then(
//function(f) {
//    $("#msg").show();
//    $("#msg").html("you have successfully purchased the product!");
//})
//    });
//    event.preventDefault();
//  });
  
   

 }
};


function renderProductDetails(productId){
  EcommerceStore.deployed().then(function(f) {
    f.getProduct.call(productId).then(function(p) {
      $("#product-name").html(p[1]);
      $("#product-image").html("<img width='200' src='http://localhost:8080/ipfs/" + p[3] + "' />");
      $("#product-price").html(p[6]);
      $("#product-id").val(p[0]);
      $("#buy-now-price").val(p[6]);
      ipfs.cat(p[4]).then(function(file) {
        var content = file.toString();
        $("#product-desc").append("<div>" + content + "</div>");

      })
      if(p[8] == '0x0000000000000000000000000000000000000000') {
        
        $("#escrow-info").hide();
      } else {
        
        $("#buy-now").hide();
        f.escrowInfo.call(productId).then(function(i) {
          $("#buyer").html("<div> 구매자: "  + i[0] + "</div>");
          $("#seller").html("<div> 판매자: " + i[1] + "</div>");
          $("#arbiter").html("<div> 중립자: " + i[2] + "</div>");
          
          $("#release-count").html(i[4].toNumber());
          $("#refund-count").html(i[5].toNumber());

        });
      }

      

    });
  })


}


// NFT 등록 함수입니다.
//function saveProduct(product) {
//  alert('등록 함수 들어옴');
//  EcommerceStore.deployed().then(function(f) {
 //   return f.addProductToStore(product["product-name"], product["product-category"], "imageLink",
 //   "descLink", Date.parse(product["product-start-time"]) / 1000,
 //   web3.utils.toWei(parseFloat(product["product-price"]).toString(), 'ether'), product["product-condition"], {from: web3.eth.accounts[0],
 //   gas: 470000});
 // }).then(function(f) {
 //   alert("등록이 완료됬습니다.");
 // });   

//}

function saveProduct(product) {
  
  var imageId;
  var descId;
  saveImageOnIpfs(reader).then(function(id) {
    imageId = id;
  saveTextBlobOnIpfs(product["product-description"]).then(function(id) {
      descId = id;


  var account;

  //이제 사용자의 계정을 얻으려면 사용자에게 권한을 요청 해야 합니다. 
  //따라서 대신 다음을 requestAccounts()
  web3.eth.requestAccounts().then(function(accounts) {
    account = accounts[0];

    if (typeof account === 'undefined') {
      alert("계정을 찾을 수 없습니다. MetaMask를 확인하세요.");
      return;
    }

    EcommerceStore.deployed().then(function(f) {
      return f.addProductToStore(
        product["product-name"],
        product["product-category"],
        imageId,
        descId,
        Date.parse(product["product-start-time"]) / 1000,
        web3.utils.toWei(parseFloat(product["product-price"]).toString(), 'ether'),
        product["product-condition"],
        { from: account, gas: 480000 }
      );
    }).then(function(result) {
      alert("등록이 완료되었습니다.");
    }).catch(function(err) {
      console.error(err);
      alert("오류 발생: " + err.message);
    });
  });
 });

});
}

function saveImageOnIpfs(reader) {
  return new Promise(function(resolve, reject){
    const buffer = Buffer.from(reader.result);
    ipfs.add(buffer)
    .then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })

}

function saveTextBlobOnIpfs(blob) {
  return new Promise(function(resolve, reject) {
    const descBuffer = Buffer.from(blob, 'utf-8');
    ipfs.add(descBuffer)
    .then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}




// NFT 등록 함수입니다.
//function saveProduct(product) {
  
 //web3.eth.getAccounts().then(function(accounts) {
  //  var account = accounts[0];
    
  // EcommerceStore.deployed().then(function(f) {
   //  return f.addProductToStore(
   //     product["product-name"],
    //    product["product-category"],
    //    "imageLink",
     //   "descLink",
     //   Date.parse(product["product-start-time"]) / 1000,
     //   web3.utils.toWei(parseFloat(product["product-price"]).toString(), 'ether'),
     //   product["product-condition"],
     //   { from: account, gas: 470000}
     // );
   // }).then(function(result) {
   //   alert("등록이 완료되었습니다.");
   // }).catch(function(err) {
   //   console.error(err);
   //  alert("오류 발생: " + err.message);
   // });
  //});
//}


// 애플리케이션의 주요 기능을 정의하는 객체를 생성합니다.
function renderStore() {
  var instance;
  return EcommerceStore.deployed().then(function(f) {
    instance = f;
    return instance.productIndex.call();
  }).then(function(count) {
    for(var i=1; i<= count; i++){
      renderProduct(instance, i);
    }
  });
}

// 특정 제품을 불러와 화면에 렌더링하는 함수입니다.
function renderProduct(instance, index) {
  instance.getProduct.call(index).then(function(f){
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
    node.append("<img style='width:200px; height:200px;' src='http://localhost:8080/ipfs/" + f[3] + "' />")
    node.append("<div class='title'>" + f[1] + "</div>");
    node.append("<div> Price: " + f[6] + "</div>");
    node.append("<a href='product.html?id=" + f[0] + "'>상세보기</div>");
    if (f[8] === '0x0000000000000000000000000000000000000000'){
      $("#product-list").append(node);
    }else{
      $("#product-purchased").append(node);
    }
  });
}

// 웹페이지가 로드될 때 실행되는 이벤트 핸들러입니다.
window.addEventListener('load', function() {
 
 if (typeof web3 !== 'undefined') {
  console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
 
  window.web3 = new Web3(window.ethereum);
 } else {
  console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");

  window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
 }

 App.start();
});