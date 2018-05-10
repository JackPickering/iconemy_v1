const $ = require('jquery');

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import token_artifacts from '../../build/contracts/PickToken.json'
import sale_artifacts from '../../build/contracts/IconemySale.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var Token = contract(token_artifacts);
var Sale = contract(sale_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var decimals;
var multiplier;
var tok_price;
var symbol;
var name;
var owner;

const moment = require('moment');
moment().format();

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    Token.setProvider(web3.currentProvider);
    Sale.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      self.refreshBalance();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  setTimes: function(unixTime, element) {
    var status = document.getElementById(element);
    var time = unixTime;
    if(time != 0){
      var formatted = moment.unix(unixTime).format("dddd, MMMM Do YYYY, h:mm:ss a");
    } else {
      formatted = '-';
    }
    status.innerHTML = formatted;
  },

  refreshBalance: function() {
    var self = this;
    var tokens_sold;

    var token;
    Token.deployed().then(function(instance) {
      token = instance;
      return token.decimals({from: account});
    }).then(function(_decimals) {
      decimals = _decimals.valueOf();
      multiplier = Math.pow(10, decimals);
      return token.symbol({from: account});
    }).then(function(_symbol) {
      symbol = _symbol.valueOf();
      var token_symbol = document.getElementById('tok_symbol');

      token_symbol.value = symbol;
      return token.name({from: account});
    }).then(function(_name) {
      name = _name;
      var name_element = document.getElementById("token_name");
      name_element.innerHTML = name;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });

    var sale;
    Sale.deployed().then(function(instance) {
      sale = instance;
      return sale.tokenBalanceOf(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      var balance_row = document.getElementById("balance_row");

      var balance = value.valueOf();
      if(balance != 0){
        balance = convertJackToPick(value.valueOf());
      }
      balance_element.innerHTML = "<span style='color: white;'>" + balance + " " + symbol + "</span>";
      return sale.rate();
    }).then(function(_rate) {
      var price = _rate;
      tok_price = convertPickToJack(price);
      tok_price = web3.fromWei(tok_price, "ether");
      var token_price = document.getElementById("token_price");
      token_price.innerHTML = tok_price + " ETH";

      return sale.startTime({from: account});
    }).then(function(value) {
      self.setTimes(value, "start_date");
      return sale.endTime({from: account});
    }).then(function(value) {
      self.setTimes(value, "end_date");
      return sale.tokensSent({from: account});
    }).then(function(value) {
      var sold_element = document.getElementById("tokens_sold");
      var text = convertJackToPick(value) + " " + symbol;

      tokens_sold = convertJackToPick(value);

      sold_element.innerHTML = text;
      return sale.owner({from: account});
    }).then(function(_owner) {
      owner = _owner.valueOf();

      if(account == owner){
        var admin_element = document.getElementById("admin_row");
        admin_row.style.display = 'block';
      }

      return sale.hardCap({from: account});
    }).then(function(value) {       
        // Sets progress bar
        console.log(value);
        var progress_element = document.getElementById("sale_progress");
        var percent = (tokens_sold / convertJackToPick(value)) * 100;
        progress_element.style.width = percent + '%';

        // Sets goal element
        var goal_element = document.getElementById("sale_goal");
        goal_element.innerHTML = convertJackToPick(value.valueOf());
    }).catch(function(e) {
      var error = e.toString();

      var goal_element = document.getElementById("sale_goal");
      var progress_element = document.getElementById("sale_progress");

      goal_element.innerHTML = "UNLIMITED";
      progress_element.style.display = 'none';

      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  buyCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("token_amount").value);

    this.setStatus("Initiating transaction... (please wait)");

    var sale;
    Sale.deployed().then(function(instance) {
      sale = instance;
      return sale.rate();
    }).then(function(_rate) {
      var price = _rate;
      var toSend = amount * price;
      toSend = convertPickToJack(toSend);
      return sale.buyTokens({value: toSend, from: account, gasPrice: web3.toWei(21, "gwei")});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  withdraw: function() {
    var self = this;

    this.setStatus("Initiating transaction... (please wait)");

    var sale;
    Sale.deployed().then(function(instance) {
      sale = instance;
      return sale.successfulWithdraw({from: account, gasPrice: web3.toWei(21, "gwei")});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  outputCommand: function() {
    var token_name = document.getElementById("token_name").value;
    var token_symbol = document.getElementById("token_symbol").value;
    var token_decimal = document.getElementById("token_decimal").value;
    var build_name = document.getElementById("build_name").value;

    var start_date = document.getElementById("start_time").value;
    start_date = moment(start_date).unix();

    var end_date = document.getElementById("end_time").value;
    end_date = moment(end_date).unix();

    var price = document.getElementById("token_price").value;
    price = parseFloat(price);
    price = web3.toWei(price, "ether");
    
    multiplier = Math.pow(10, token_decimal);

    price = convertJackToPick(price);

    var owner_address = document.getElementById("owner_address").value;
    var beneficiary_address = document.getElementById("beneficiary_address").value;

    var cli = "node create.js '" + token_name + "' '" + token_symbol + "' " + token_decimal + " " + start_date + " " + end_date + " " + price + " '" + owner_address + "' '" + beneficiary_address + "' '" + build_name + "'";

    var output_box = document.getElementById("command_box");
    output_box.style.display = "block";

    var output = document.getElementById("command_text");
    output.innerHTML = cli;

    console.log(cli);
  },

  copyCommand: function() {
    var command = document.getElementById('command_text');
    copyTextToClipboard(command.innerHTML);
      /* Alert the copied text */
    alert("Copied command to clipboard");
  }
};

function convertEthToWei(eth){
  var wei = 0;

  wei = eth * 1000000000000000000;

  return wei;
}

function convertWeiToEth(wei){
  var eth = 0;

  eth = wei / 1000000000000000000;

  return eth.toFixed(4);
}

function convertJackToPick(jack){
  var picks = 0;

  picks = jack / multiplier;

  return picks;
}

function convertPickToJack(pick){
  var jacks = 0;

  jacks = pick * multiplier;

  return jacks;
}

function changeProgress(hardCap, tokensSold){
  $('#sale_progress').attr('aria-valuenow', '100');
}

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

$(document).ready(function(){
    $("#token_amount").keyup(function() {
        var tokens = document.getElementById("token_amount").value;
        var eth = document.getElementById("ether_amount"); 
        eth.value = parseFloat(tokens * tok_price);
    });

    $("#ether_amount").keyup(function() {
        var eth = document.getElementById("ether_amount").value;
        var tokens = document.getElementById("token_amount"); 
        tokens.value = parseFloat(eth / tok_price);
    });

    $("#softCapCheck").change(function() {
      var section = document.getElementById('softCapSection');
      
      if(this.checked) {
          section.style.display = 'block';
      } else {
          section.style.display = 'none';
      }
    });

    $("#hardCapCheck").change(function() {
      var section = document.getElementById('hardCapSection');
      
      if(this.checked) {
          section.style.display = 'block';
      } else {
          section.style.display = 'none';
      }
    });
});

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});
