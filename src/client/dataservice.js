import {loadTemplate} from './utils.js';
import {context} from './context.js'; //Singleton
import Person from './person.js';
import GradedTask from './gradedtask.js';

function updateFromServer() {
  if (context.user.id) {
    loadTemplate('api/getStudents',function(response) {
                            localStorage.setItem('students',response);
                            loadStudentsToLocalStorage();
                            context.getTemplateRanking();
                          },'GET','',false);
    loadTemplate('api/getGradedTasks',function(response) {
                          localStorage.setItem('gradedTasks',response);
                          loadGradedTasksToLocalStorage();
                          context.getTemplateRanking();
                        },'GET','',false);
    loadTemplate('api/getSettings',function(response) {
                        localStorage.setItem('settings',response);
                        loadSettingsToLocalStorage();
                        context.getTemplateRanking();
                      },'GET','',false);

  }
}
function saveStudents(arrayStudents) {
  localStorage.setItem('students',arrayStudents);
  loadTemplate('api/saveStudents',function(response) {
                          console.log('SAVE STUDENTS ' + response);
                        },'POST',localStorage.getItem('students'),false);
}
function saveAvatar(){
  debugger;
  loadTemplate('api/saveAvatar',function(response) {
                          console.log('AVATAR'+localStorage.getItem('avatar'));
  },'POST',localStorage.getItem('avatar'),false);
}
function saveGradedTasks(arrayGT) {
  localStorage.setItem('gradedTasks',arrayGT);
  loadTemplate('api/saveGradedTasks',function(response) {
                          console.log('SAVE GRADED TASKS ' + response);
                        },'POST',localStorage.getItem('gradedTasks'),false);
}
function saveSettings(graded) {
  localStorage.setItem('settings',graded);
  loadTemplate('api/saveSettings',function(response) {
    console.log('SAVE SETTINGS ' + response);
  },'POST', localStorage.getItem('settings'),false);
 
}
function loadStudentsToLocalStorage() {
  if (localStorage.getItem('students')) {
    let students_ = new Map(JSON.parse(localStorage.getItem('students')));
    students_.forEach(function(value_,key_,students_) {
        students_.set(key_,new Person(value_.name,value_.surname,
          value_.attitudeTasks,value_.id,value_.avatar));
      });
    context.students = students_;
  }
}
function loadGradedTasksToLocalStorage() {
  if (localStorage.getItem('gradedTasks')) {
    let gradedTasks_ = new Map(JSON.parse(localStorage.getItem('gradedTasks')));
    gradedTasks_.forEach(function(value_,key_,gradedTasks_) {
        gradedTasks_.set(key_,new GradedTask(value_.name,value_.description,value_.weight,
          value_.studentsMark,value_.id));
      });
    context.gradedTasks = gradedTasks_;
  }
}
function loadSettingsToLocalStorage() {
  if (localStorage.getItem('settings')) {
    let settings_ = new Map(JSON.parse(localStorage.getItem('settings')));
    context.settings_final = settings_;
  }
}

export {updateFromServer,saveStudents,saveGradedTasks,saveSettings,saveAvatar};
