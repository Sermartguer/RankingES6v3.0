/**
 * Context class. Devised to control every element involved in the app: students, gradedTasks ...
 *
 * @constructor
 * @tutorial pointing-criteria
 */

/*jshint -W061 */

import Person from './person.js';
import GradedTask from './gradedtask.js';
import {updateFromServer,saveStudents,saveGradedTasks,saveSettings} from './dataservice.js';
import {hashcode,loadTemplate,setCookie,getCookie} from './utils.js';
import {generateMenu} from './menu.js';
import {template} from './templator.js';

class Context {

  constructor() {
    this.students = new Map();
    this.gradedTasks = new Map();
    this.settings_final = new Map();
    this.showNumGradedTasks = 1;//Max visible graded tasks in ranking list table
    if (getCookie('user')) {
      this.user = JSON.parse(getCookie('user'));
    }
  }

  /** Check if user is logged */
  isLogged() {
    loadTemplate('api/loggedin',function(response) {
      if (response === '0') {
        //alert('LOGGED IN 0');
        this.user = undefined;
        this.login();
        return false;
      }else {
        //alert('LOGGED IN TRUE');
        this.user = JSON.parse(response);
        updateFromServer();
        this.getTemplateRanking();
        return true;
      }
    }.bind(this),'GET','',false);
  }

  /** Show login form template when not authenticated */
  login() {
    let that = this;
    if (!this.user) {
      loadTemplate('templates/login.html',function(responseText) {
        that.hideMenu();
        document.getElementById('content').innerHTML = eval('`' + responseText + '`');
        let loginForm = document.getElementById('loginForm');

        loginForm.addEventListener('submit', (event) => {
          event.preventDefault();
          let username = document.getElementsByName('username')[0].value;
          let password = document.getElementsByName('password')[0].value;
          loadTemplate('api/login',function(userData) {
            that.user = JSON.parse(userData);
            setCookie('user',userData,7);
            updateFromServer();
            that.getTemplateRanking();
          },'POST','username=' + username + '&password=' + password,false);
          return false; //Avoid form submit
        });
      });
    }else {
      generateMenu();
      that.getTemplateRanking();
    }
  }

  showMenu() {
    document.getElementById('navbarNav').style.visibility = 'visible';
  }

  hideMenu() {
    document.getElementById('navbarNav').style.visibility = 'hidden';
  }

  /** Get a Person instance by its ID */
  getPersonById(idHash) {
    return this.students.get(parseInt(idHash));
  }
  /** Get a GradedTask instance by its ID */
  getGradedTaskById(idHash) {
    return this.gradedTasks.get(parseInt(idHash));
  }
  /** Draw Students ranking table in descendent order using total points as a criteria */
  getTemplateRanking() {
    generateMenu();
    this.showMenu();

    if (this.students && this.students.size > 0) {
      //alert('SI STUDENTS');
      /* We sort students descending from max number of points to min */
      let arrayFromMap = [...this.students.entries()];
      arrayFromMap.sort(function(a,b) {
        return (b[1].finalGrade(b[1].getId()) - a[1].finalGrade(a[1].getId()));
      });
      this.students = new Map(arrayFromMap);

      saveStudents(JSON.stringify([...this.students]));
      let TPL_GRADED_TASKS = '';

      if (this.gradedTasks && this.gradedTasks.size > 0) {
        if (this.showNumGradedTasks >= this.gradedTasks.size) {
          this.showNumGradedTasks = this.gradedTasks.size;
        }
        let arrayGradedTasks = [...this.gradedTasks.entries()].reverse();
        for (let i = 0;i < this.showNumGradedTasks;i++) {
          if (i === (this.showNumGradedTasks - 1)) {
            TPL_GRADED_TASKS += '<th><a href="#detailGradedTask/' + arrayGradedTasks[i][0] + '">' +
                  arrayGradedTasks[i][1].name + '(' + arrayGradedTasks[i][1].weight + '%)&nbsp;</a><a href="#MoreGradedTasks"><button id="more_gt"><i class="fa fa-hand-o-right fa-1x"></i></button></a></th>';
          } else {
            TPL_GRADED_TASKS += '<th><a href="#detailGradedTask/' + arrayGradedTasks[i][0] + '">' + arrayGradedTasks[i][1].name + '(' + arrayGradedTasks[i][1].weight + '%)</a></th>';
          }
        }
      }
      let scope = {};
      scope.TPL_GRADED_TASKS = TPL_GRADED_TASKS;
      scope.TPL_PERSONS = arrayFromMap;

      loadTemplate('templates/rankingList.html',function(responseText) {
              let out = template(responseText,scope);
              //console.log(out);
              document.getElementById('content').innerHTML = eval('`' + out + '`');
              let that = this;
              let callback = function() {
                  let gtInputs = document.getElementsByClassName('gradedTaskInput');
                  Array.prototype.forEach.call(gtInputs,function(gtInputItem) {
                        gtInputItem.addEventListener('change', () => {
                          let idPerson = gtInputItem.getAttribute('idStudent');
                          let idGradedTask = gtInputItem.getAttribute('idGradedTask');
                          let gt = that.gradedTasks.get(parseInt(idGradedTask));
                          gt.addStudentMark(idPerson,gtInputItem.value);
                          that.getTemplateRanking();
                        });
                      });
                };
              callback();
            }.bind(this));
    }else {
      //alert('NO STUDENTS');
      document.getElementById('content').innerHTML ='';
    }
  }

  /** Create a form to create a GradedTask that will be added to every student */
  addGradedTask() {

    let callback = function(responseText) {
      let GLB_WEIGHT = 0;
      let GBL_MAX = 0;
      for (let i = 0; i<context.gradedTasks.size;i++){
        GLB_WEIGHT += eval(parseInt([...context.gradedTasks][i][1].weight));  
      }
      if(context.gradedTasks.size === 0){
        GBL_MAX = 0;
      }else{
        GBL_MAX = 100 - GLB_WEIGHT;
      }
            document.getElementById('content').innerHTML = eval('`' + responseText + '`');
            let saveGradedTask = document.getElementById('newGradedTask');

            saveGradedTask.addEventListener('submit', () => {
              let name = document.getElementById('idTaskName').value;
              let description = document.getElementById('idTaskDescription').value;
              let weight = document.getElementById('idTaskWeight').value;
              let gtask = new GradedTask(name,description,weight,[]);
              let gtaskId = gtask.getId();
              this.students.forEach(function(studentItem,studentKey,studentsRef) {
                gtask.addStudentMark(studentKey,0);
              });
              this.gradedTasks.set(gtaskId,gtask);
              saveGradedTasks(JSON.stringify([...this.gradedTasks]));
              this.getTemplateRanking();
              return false; //Avoid form submit
            });
          }.bind(this);

    loadTemplate('templates/addGradedTask.html',callback);
  }
  /** Add a new person to the context app */
  addPerson() {

    let callback = function(responseText) {
            document.getElementById('content').innerHTML = responseText;
            let saveStudent = document.getElementById('newStudent');

            saveStudent.addEventListener('submit', (event) => {
              event.preventDefault();
              let name = document.getElementById('idFirstName').value;
              let surnames = document.getElementById('idSurnames').value;
              let avatar = document.getElementById('myFile');
              let student = new Person(name,surnames,[]);
              this.gradedTasks.forEach(function(iGradedTask) {
                    iGradedTask.addStudentMark(student.getId(),0);
                  });
              this.students.set(student.getId(),student);
              this.getTemplateRanking();
              return false; //Avoid form submit
            });
          }.bind(this);

    loadTemplate('templates/addStudent.html',callback);
  }
  settings() {
    let callback = function(responseText) {
      let TPL_ATTITUDE = 0;
      let TPL_GRADED = 0;
      let TPL_SVALUE = 0;
      if (localStorage.getItem('settings')){
        
        let g = JSON.parse(localStorage.getItem('settings'));
        console.log(g);
        TPL_GRADED = g[0][1];
        TPL_ATTITUDE = 100-g[0][1];
        TPL_SVALUE = g[0][1];
        
      }
      document.getElementById('content').innerHTML = eval('`' + responseText + '`');
      let slide = document.getElementById('slider');
      slide.onchange = function() {
        TPL_GRADED = slide.value;
        TPL_ATTITUDE = 100 - slide.value;
        //settings_final.push("settings",parseInt(slide.value));
        
        context.settings_final.set("settings",parseInt(slide.value));
        saveSettings(JSON.stringify([...context.settings_final]));
        loadTemplate('templates/settings.html',callback);
    }.bind(this);
  }
    loadTemplate('templates/settings.html',callback);
  }

  /** Add last action performed to lower information layer in main app */
  notify(text) {
    document.getElementById('notify').innerHTML = text;
  }
}

export let context = new Context(); //Singleton export
