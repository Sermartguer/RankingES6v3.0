'use strict'
import {context} from './context.js';
import {deleteCookie,loadTemplate} from './utils.js';

function generateMenu() {
  let output = '';
  if (context.user.displayName) {
    output += '<li class="nav-item"><a class="nav-link welcome" href="">Welcome ' + context.user.displayName + '</a></li>';
  }
  output += '<li class="nav-item nav-item-menu"><a class="nav-link" href="#settings">Settings</a></li>';
  output += '<li class="nav-item nav-item-menu"><a class="nav-link" href="#addStudent"> + Student</a></li>';
  output += '<li class="nav-item nav-item-menu"><a class="nav-link" href="#addGradedTask"> + Graded task</a></li>';
  if (context.user.displayName) {
    output += '<li class="nav-item-logout"><a class="nav-link" href="#logout"><i class="fa fa-sign-out" aria-hidden="true"></i> LOGOUT</a></li>';
  }
  document.getElementById('menuButtons').innerHTML = output;
}

function logout() {
  context.user = '';
  deleteCookie('user');
  deleteCookie('connect.sid');
  loadTemplate('api/logout',function(response) {
                context.login();
              },'GET','',false);
}
export {generateMenu,logout};
