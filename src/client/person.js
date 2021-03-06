/**
 * Person class. We store personal information and attitudePoints that reflect daily classroom job
 *
 * @constructor
 * @param {string} name - Person name
 * @param {string} surname - Person surname
 * @param {array} attitudeTasks - Person awarded AttitudeTasks array   
 * @param {number} id - Person id default value null whwen created first time
 * @tutorial pointing-criteria
 */

import {formatDate,popupwindow,hashcode,loadTemplate,getBase64} from './utils.js';
import {context} from './context.js';
import AttitudeTask from './attitudetask.js';
import GradedTask from './gradedtask.js';
import {saveStudents} from './dataservice.js';
import {template} from './templator.js';

const privateAddTotalPoints = Symbol('privateAddTotalPoints'); /** To accomplish private method */
const _totalPoints = Symbol('TOTAL_POINTS'); /** To acomplish private property */

class Person {
  constructor(name,surname,attitudeTasks,id=null) {
    this[_totalPoints] = 0;
    this.name = name;
    this.surname = surname;
    if (!id) {
      this.id = hashcode(this.name + this.surname);
    }else {
      this.id = id;
    }

    this.attitudeTasks = attitudeTasks;

    this.attitudeTasks.forEach(function (itemAT) {
      this[_totalPoints] += parseInt(itemAT['task'].points);
    }.bind(this));
  }

  /** Add points to person. we should use it carefully . */
  [privateAddTotalPoints] (points) {
    if (!isNaN(points)) {
      this[_totalPoints] += points;
      context.getTemplateRanking();
    }
  }

  /** Get person id  based on a 10 character hash composed by name+surname */
  getId() {
    return this.id;
  }
  getAvatar(){
    return '../src/server/data/333342/fotos_alumnes/'+this.getId()+'.jpg';
  }
  /** Read person _totalPoints. A private property only modicable inside person instance */
  getTotalPoints() {
    return this[_totalPoints];
  }
  finalGrade(idgrade) {
    let totalgraded = 0;
    let totalattitude = 0;
    let total = 0;
    let grpoints = 0;
    if (localStorage.getItem('settings')){
      grpoints = context.students.get(idgrade).getGTtotalPoints();
      let gradedweight = parseInt(context.settings_final.get("settings"));
      totalgraded = (grpoints * gradedweight)/100;
      totalattitude = (this.getTotalPoints() * (100-gradedweight)/this.getHigherAPerson());
      if(totalattitude != isNaN){
        total = totalgraded + totalattitude;
      }else{
        total = totalgraded + 0;
      }
    }
    return Math.round(total);
  }
  /** Add a Attitude task linked to person with its own mark. */
  addAttitudeTask(taskInstance) {
    this.attitudeTasks.push({'task':taskInstance});
    this[privateAddTotalPoints](parseInt(taskInstance.points));
    context.notify('Added ' + taskInstance.description + ' to ' + this.name + ',' + this.surname);
  }
  /** Get students Marks sliced by showNumGradedTasks from context*/
  getStudentMarks() {
    let gtArray = GradedTask.getStudentMarks(this.getId()).reverse();
    return gtArray.slice(0,context.showNumGradedTasks);
  }

  getGTtotalPoints() {
    return GradedTask.getStudentGradedTasksPoints(this.getId());
  }
  getHigherAPerson() {
    let max = [0];
    [...context.students].forEach(function(student,index){
      let p = 0;
        p = parseInt(student[1].getTotalPoints());
        if (p > max[0]){
          max.unshift(p);
        }
    });
    return max[0];
  }
  /** Renders person edit form */
  getHTMLEdit() {
    let callback = function(responseText) {
      document.getElementById('content').innerHTML = responseText;
      let saveStudent = document.getElementById('newStudent');
      document.getElementById('idFirstName').value = this.name;
      document.getElementById('idSurnames').value = this.surname;
      let oldId = this.getId();
      let avatar = document.getElementById('myFile');
      avatar.addEventListener('change', () => {
        getBase64(avatar.files[0],oldId);
        console.log('--BASE--');
      });
      saveStudent.addEventListener('submit', (event) => {
        let oldId = this.getId();
        this.name = document.getElementById('idFirstName').value;
        this.surname = document.getElementById('idSurnames').value;
        let student = new Person(this.name,this.surname,this.attitudeTasks,this.id);
        context.students.set(student.getId(),student);
        saveStudents(JSON.stringify([...context.students]));
     
      });
    }.bind(this);

    loadTemplate('templates/addStudent.html',callback);
  }
  /** Renders person detail view */
  getHTMLDetail() {
    loadTemplate('templates/detailStudent.html',function(responseText) {
        document.getElementById('content').innerHTML = responseText;
        let TPL_STUDENT = this;
        let scope = {};
        scope.TPL_ATTITUDE_TASKS = this.attitudeTasks.reverse();
        /*scope.TPL_GRADED_TASKS = [...context.gradedTasks.entries()];
        this.attitudeTasks.reverse().forEach(function(atItem) {
          TPL_ATTITUDE_TASKS += '<li class="list-group-item">' + atItem.task.points + '->' +
                        atItem.task.description + '->' + formatDate(new Date(atItem.task.datetime)) + '</li>';
        });
        */
        let TPL_GRADED_TASKS = '';
        context.gradedTasks.forEach(function(gtItem) {
          TPL_GRADED_TASKS += '<li class="list-group-item">' + gtItem.getStudentMark(TPL_STUDENT.getId()) + '->' +
                        gtItem.name + '->' + formatDate(new Date(gtItem.datetime)) + '</li>';
        });
        let out = template(responseText,scope);
        document.getElementById('content').innerHTML = eval('`' + out + '`');
      }.bind(this));
  }
}

export default Person;
