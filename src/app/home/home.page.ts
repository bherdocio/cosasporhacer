import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionSheetController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import * as moment from 'node_modules/moment/moment'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  url = ' http://localhost:3000/tasks/';
  tareas: any;
  hoy = Date.now();
  checked = [];
  old: any;
  hoy2: any;
  last: any = 1;
  loading: any;

  constructor(private http: HttpClient, private loadingCtrl: LoadingController,private toast: ToastController, private alertCtrl: AlertController, private actionSheetController: ActionSheetController) {
    
    this.hoy2 = moment().format("DD/MM/YYYY");

    //inicia las tareas y establece el filtro por defecto  
    this.getTareas().subscribe(tareas =>{
      this.tareas = tareas;
      this.filtrar(1);
    });

  }

  //establece la antigua fecha para compararla con la nueva al cambiar el ngModel
  setOld(fecha){
    this.old = fecha;
  }
  
  confirmarFecha(tarea){
    
    this.presentAlert2("¿Desea actualizar la fecha?", "", [
      {
        text: 'Confirmar',
        handler: () => {
          this.actualizar(tarea);
        }
      },
      {
        text: 'Cancelar',
        handler: () => {
          tarea.fechaV = this.old;
        }
      }
    ]);
    
  }

  //actualiza la fecha de la tarea
  actualizar(tarea){

    let x = tarea.fechaV.substring(0, 10);
    let y = this.old.substring(0, 10);

    if(x !== y){
      let postData = {
        "titulo": tarea.titulo,
        "fechaC": tarea.fechaC,
        "fechaV": tarea.fechaV.substring(0, 10),
        "liberada": tarea.liberada
      }
  
      this.http.put(this.url+tarea.id, postData).subscribe(res => {
        this.getTareas().subscribe(tareas =>{
          this.tareas = tareas;
        });
        console.log(res);
      }, (err) => {
        console.log(err);
      });
  
      this.presentToast("Fecha actualizada");
    }else{
      this.presentToast("La fecha no ha cambiado");
    }
    
  }

  //presenta mensaje simple tipo toast
  async presentToast(message) {
    const toast = await this.toast.create({
      message,
      duration: 3000
    });
    toast.present();
  }

  async presentAlert2(header, subHeader, buttons) {
    const alert = await this.alertCtrl.create({
      header,
      subHeader,
      buttons
    });

    await alert.present();
  }

  //presenta alerta con inputs para agregar tarea
  async presentAlert(header, subHeader, buttons) {
    const alert = await this.alertCtrl.create({
      header,
      subHeader,
      inputs: [
        {
          id: "autofocus",
          name: 'taskName',
          type: 'text',
          placeholder: 'Ingrese el nombre de la tarea'
        },
        {
          name: 'taskDate',
          type: 'date',
          value: moment().format("YYYY-MM-DD"),
          min: moment().format("YYYY-MM-DD")
        }
      ],
      buttons
    });

    await alert.present();
  }

  async presentLoading(message) {
    this.loading = await this.loadingCtrl.create({
      message
    });
    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();

    console.log('Loading dismissed!');
  }

  //presenta menú con opciones para seleccionar los filtros
  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione el filtro',
      buttons: [{
        text: 'Fecha de creación',
        icon: 'add',
        handler: () => {
          this.filtrar(1);
        }
      }, {
        text: 'Fecha de vencimiento',
        icon: 'sad',
        handler: () => {
          this.filtrar(2);
        }
      }, {
        text: 'Estado',
        icon: 'heart',
        handler: () => {
          this.filtrar(3);
        }
      }, {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  //calcula la diferencia en días de las tareas con respecto a la fecha actual
  calcularDif(tarea){
    let fecha = new Date(tarea.fechaV);
    let diffTiempo = fecha.getTime() - this.hoy;
    let diffDias = diffTiempo / (1000 * 3600 * 24);
    return Math.round(diffDias);
  }
  //uso de la api rest para traer las tareas
  getTareas() {
    return this.http.get(this.url);
  }
  //presenta la alerta para agregar tareas y verifica si los campos requeridos han sido llenados
  //retorna mensaje simple que indica al usuario que debe ingresar todos los campos
  agregar(){
    this.presentAlert('Agregar tarea', '', [
      {
        text: 'Agregar',
        handler: (alertData) => {
          if(alertData.taskName === "" || alertData.taskDate === ""){
            this.presentToast("Debe ingresar ambos campos")
          }else{
            this.agregarTarea(alertData);
          } 
        }
      },
      {
        text: 'Cancelar',
        handler: () => {
        }
      }
    ]).then(() =>{
      document.getElementById('autofocus').focus();
    });
  }

  //uso de la api rest para agregar las tareas a la bd y actualiza la vista con la nueva tarea
  agregarTarea(data){
    console.log("Hi")
    return new Promise((resolve, reject) => {
      let today = new Date();

      let postData = {
        "titulo": data.taskName,
        "fechaC": today.toISOString().substring(0, 10),
        "fechaV": data.taskDate,
        "liberada": false
      }

      this.http.post(this.url, postData).subscribe(res => {
        this.getTareas().subscribe(tareas =>{
          this.tareas = tareas;
          this.filtrar(this.last);
        });
        resolve(res);
        console.log(res);
      }, (err) => {
        console.log(err);
        reject(err);
      });

    });
  }

  //agrega las tareas que son marcadas con el checkbox a un array, que sirve para liberar las tareas
  agregarSelec(event, id : number){
    if(event.target.checked){
      this.checked.push(id);
    }else{
      let index = this.quitarSelect(id);
      this.checked.splice(index, 1);
    }
  }

  //quita la tarea seleccionada del array
  quitarSelect(id : number){
    return this.checked.findIndex((x) =>{
      return x === id;
    })
  }

  //método que libera las tareas que son incluidas en el array anterior, conservando sus datos pero actualizando el liberada 
  liberar(){
    if(this.checked.length <= 0){
      this.presentToast("Debe seleccionar al menos una tarea para liberar");
    }else{
      this.presentLoading("Espere un momento...");
      this.checked.forEach(async (tarea) =>{

        let postData = {
          "titulo": tarea.titulo,
          "fechaC": tarea.fechaC,
          "fechaV": tarea.fechaV,
          "liberada": true
        }
  
          await this.http.put(this.url+tarea.id, postData).subscribe(res => {
            console.log(res);
            this.getTareas().subscribe(tareas =>{
              this.tareas = tareas;
              this.filtrar(this.last);
            });
          }, (err) => {
            console.log(err);
          });
        
      });

      setTimeout(() =>{
        this.loading.dismiss();
      }, 500);

      this.presentToast("Tareas liberadas");
      this.checked = [];
    }
  }

  eliminar(){
    if(this.checked.length <= 0){
      this.presentToast("Debe seleccionar al menos una tarea para eliminar");
    }else{

      this.presentLoading("Espere un momento...");
      this.checked.forEach(async (tarea) =>{
  
        await this.http.delete(this.url+tarea.id).subscribe(res => {
          console.log(res);
          this.getTareas().subscribe(tareas =>{
            this.tareas = tareas;
            this.filtrar(this.last);
          });
        }, (err) => {
          console.log(err);
        });
        
      });



      setTimeout(() =>{
        this.loading.dismiss();
      }, 500)
      
      this.presentToast("Tareas eliminadas");
      this.checked = [];
    }
  }

  //filtra las tareas según el criterio seleccionado por el usuario
  filtrar(num){
    this.last = num;

    if(num === 1){
      //fecha creación mayor a menor
      this.tareas = this.tareas.sort((a, b)=> {
        return <any>new Date(b.fechaC) - <any>new Date(a.fechaC);
      });
    }else if(num === 2){
      //fecha vencimiento menor a mayor
      this.tareas = this.tareas.sort((a, b)=> {
        return <any>new Date(a.fechaV) - <any>new Date(b.fechaV);
      });
    }else if(num ===3){
      //según estado
      this.filtrar(2);
      this.tareas = this.tareas.sort((a, b)=> {
        return a.liberada-b.liberada;
      });
    }

  }

}
