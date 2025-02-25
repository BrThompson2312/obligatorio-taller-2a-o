const ruteo = document.querySelector("#ruteo");
const $ = (p) => document.querySelector(p);

const urlBase = 'https://movetrack.develotion.com';

let tiempo = Number(localStorage.getItem("tiempoTotal"));
let tiempoSesionActual = 0;

inicio();
ocultarSecciones();
eventos();

function inicio() {
    // console.clear();

    console.log(Number(localStorage.getItem("tiempoTotal")))

    if (localStorage.getItem("tiempoTotal")==null) {
        localStorage.setItem("tiempoTotal", tiempo)
    }

    console.log(localStorage.getItem("token"));
    if (localStorage.getItem("token") == null) {
        mostrarMenuLogueado(false);
        ruteo.push("/login");
    } else {
        mostrarMenuLogueado();
        selectActividades();
        ruteo.push("/");

        tiempo = Number(localStorage.getItem("tiempoTotal"));
        setInterval(() => {
            if (localStorage.getItem("token")!=null){
                console.log(tiempo)
                tiempo+=1;
                tiempoSesionActual+=1;
            }
        }, 1000)

        tiempoTotalIniciadoSesion();
    }
}

function ocultarSecciones() {
    const divs = document.querySelectorAll(".ion-page");
    for (let i = 0; i < divs.length; i++) {
        if (i == 0) continue; // <--- Se debe a que el nodo raiz (ion-app) contiene la clase "ion-page", por ende debe ser omitida
        divs[i].style.display = "none";
    }
}

function mostrarMenuLogueado(flg=true) {
    if (flg==false) {
        document.querySelectorAll("#menu ion-item").forEach(e => {
            e.style.display = "none";
        });
        document.querySelectorAll("#menu .menuLogin").forEach(e => {
            e.style.display = "block";
        })
    } else {
        document.querySelectorAll("#menu ion-item").forEach(e => {
            e.style.display = "block";
        });
        document.querySelectorAll("#menu .menuLogin").forEach(e => {
            e.style.display = "none";
        })
    }
}

function rutas(event) {
    ocultarSecciones();
    switch(event.detail.to) {
        case '/registro':
            if (localStorage.getItem("token") != null) return ruteo.push("/");
            $("#registro").style.display = "block";
            break;

        case '/login':
            if (localStorage.getItem("token") != null) return ruteo.push("/");
            $("#login").style.display = "block";
            break;

        case '/':
            verificarLogueado();
            $("#main-content").style.display = "block";
            break;

        case '/agregarRegistro':
            verificarLogueado();
            $("#agregarRegistro").style.display = "block";
            break;

        case '/listadoRegistros':
            verificarLogueado();
            listadoRegistros();
            $("#listadoRegistros").style.display = "block";
            break;

        case '/logout':
            cerrarSesion();
            break;

        default:
            ruteo.push("/");
    }
}

function verificarLogueado() {
    if (localStorage.getItem("token") == null) {
        return ruteo.push("/login");
    }
}

function cerrarSesion(e=0) {
    let time = e;

    switch(e) {
        case 401:
            mostrarMensaje("Token invalido o vencido, inicie sesión nuevamente");
            time=1500;
            break;

        default:
            mostrarMensaje("Sesion cerrada");
    }

    setTimeout(() => {
        // localStorage.clear();

        localStorage.removeItem("token")
        localStorage.removeItem("id");

        localStorage.setItem("tiempoTotal", Number(localStorage.getItem("tiempoTotal"))+tiempo)

        console.log("Duracion total: "+localStorage.getItem("tiempoTotal")+" Segundos")
        console.log(
            "Duracion de la sesion reciente: \n" 
            + tiempoSesionActual/60 + " Minutos\n"
            + tiempoSesionActual + " Segundos"
        )

        ruteo.push("/login");
        inicio();
    }, time)
}

function eventos() {
    ruteo.addEventListener("ionRouteWillChange", rutas)
    $("#btnRegistrar").addEventListener("click", registrarse);
    $("#btnLogin").addEventListener("click", login);
    $("#btnAgregarRegistro").addEventListener("click", agregarRegistroActividad);

    const menuRoutes = document.querySelectorAll("#menu ion-item");
    menuRoutes.forEach(e => {
        e.addEventListener("click", () => {
            document.querySelector("#menu").close();
        })
    })
}

function registrarse() {
    try {
        mostrarMensaje("Cargando...");

        const txtUsuario = $("#txtUsuario").value;
        const txtPassword = $("#txtPassword").value;
        const txtResidencia = $("#txtResidencia").value;

        validarRegistro(txtUsuario, txtPassword, txtResidencia);
        const idPais = buscarPaisXNombre(txtResidencia);

        if (idPais != null) {
            const usuario = {
                "usuario": txtUsuario,
                "password": txtPassword,
                "idPais": idPais
            }
            fetch(urlBase+"/usuarios.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuario)
            })
            .then(e => e.json())
            .then(e => {
                if (e.codigo == 200) {
                    localStorage.setItem("id", e.id);
                    localStorage.setItem("token", e.apiKey);
                    inicio();
                } else {
                    console.log(e.mensaje);
                    mostrarMensaje(e.mensaje)
                }
            })
            .catch(e => console.log(e))
            
        } else {
            console.log("pais nulo")
        }

    } catch (e) {
        console.log(e.message)
        mostrarMensaje(e.message)
    }
}

function validarCredencialesLogin(usuario, password) {
    if (usuario.trim().length == 0) {
        throw new Error("Usuario vacio");
    }
    if (password.trim().length == 0) {
        throw new Error("Contraseña vacia");
    }
}

function login() {
    try {

        if (localStorage.getItem("token") != null) {
            throw new Error("Ya está logueado")
        }

        const txtUsuario = $("#txtUsuarioLogin").value;
        const txtPassword = $("#txtPasswordLogin").value;

        validarCredencialesLogin(txtUsuario, txtPassword);

        mostrarMensaje("Cargando...");

        const usuario = {
            usuario: txtUsuario,
            password: txtPassword 
        }
        fetch(urlBase+"/login.php", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        })
        .then(e => e.json())
        .then(e => {
            if (e.codigo != 200) {
                mostrarMensaje(e.mensaje);
            } else {
                console.log(e);

                mostrarMensaje("Login Exitoso");

                localStorage.setItem("id", e.id)
                localStorage.setItem("token", e.apiKey)

                inicio();
            }
        })
        .catch(e => console.log(e))

    } catch (e) {
        mostrarMensaje(e.message);
    }
}

function validarRegistro(nombre, password, residencia) {
    if (nombre.trim().length == 0) {
        throw new Error("Nombre obligatorio");
    }
    if (password.trim().length == 0) {
        throw new Error("Contraseña obligatoria");
    }
    if (residencia.trim().length == 0) {
        throw new Error("Residencia obligatoria");
    }
}

function mostrarMensaje(mensaje, duration=1500, position="bottom", color) {
    const toast = document.createElement('ion-toast');
    toast.color = color;
    toast.duration = duration,
    toast.position = position
    toast.message = mensaje;
    document.body.appendChild(toast);
    toast.present();
}

async function apiPaises() {
    try {
        const response = await fetch(urlBase+'/paises.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return await response.json();
    } catch (e) {
        return e.message
    }
}

async function buscarPaisXNombre(residencia) {
    await apiPaises()
    .then(response => {
        for (let i = 0; i < response.paises.length; i++) {
            if (response.paises[i].name == residencia) {
                return response.paises[i].id;
            }
        }
        console.log("Residencia no encontrada")
        mostrarMensaje("Residencia no encontrada");
        return null;
    })
    .catch(e => {
        console.log(e)
        mostrarMensaje(e)
    });
}

async function apiActividades() {
    try {
        const response = await fetch(urlBase+"/actividades.php", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("token"),
                'iduser': localStorage.getItem("id")
            }
        });
        return await response.json();
    } catch(e) {
        return e;
    }
}

function selectActividades() {
    apiActividades()
    .then(e => {
        console.log(e)
        if (e.codigo == 200) {
            e.actividades.forEach(i => {
                document.querySelector("#agregarRegistro ion-select").innerHTML += 
                `<ion-select-option value="${i.id}">${i.nombre}</ion-select-option>`;
            })
        } else {
            console.log(e.mensaje);
            cerrarSesion(e.codigo);
        }
    })
}

function agregarRegistroActividad() {
    try {
        let txtActividad = $("#txtActividadRegistro").value;
        let txtTiempo = $("#txtTiempoRegistro").value;
        let txtFecha = $("#txtFechaRegistro").value;
    
        if (txtActividad == "" || txtTiempo == "" || txtFecha == "") {
            throw new Error("Campos vacios")
        }
    
        console.log(txtActividad, txtTiempo, txtFecha);
    
        const registro = {
            idActividad: txtActividad,
            idUsuario: localStorage.getItem("id"),
            tiempo: txtTiempo,
            fecha: txtFecha
        };
    
        mostrarMensaje("Registrando...", undefined, undefined, "warning");
        fetch(urlBase+"/registros.php", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("token"),
                'iduser': localStorage.getItem("id")
            },
            body: JSON.stringify(registro)
        })
        .then(e => e.json())
        .then(e => {
            if (e.codigo == 401) {
                cerrarSesion(e.codigo);
            }
            if (e.codigo == 200) {
                console.log(e)
                mostrarMensaje(e.mensaje)
    
                $("#txtActividadRegistro").value = "";
                $("#txtTiempoRegistro").value = "";
                $("#txtFechaRegistro").value = "";
            }
        })
    } catch (e) {
        console.log(e.message);
        mostrarMensaje(e.message);
    }
}

async function apiRegistros() {
    try {
        const response = await fetch(urlBase+"/registros.php?idUsuario="+localStorage.getItem("id"), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("token"),
                'iduser': localStorage.getItem("id")
            },
        })
        return await response.json();
    } catch (e) {
        return e;
    }
}

function listadoRegistros() {
    $("#registros").innerHTML="";
    mostrarMensaje("Cargando Listado...", undefined, undefined, "warning")
    apiRegistros()
    .then(e => {
        if (e.codigo == 200) {
            console.log(e)
            if (e.registros.length == 0) {
                $("#listadoRegistros div").innerHTML = "<p>No hay registros</p>"
            } else {
                e.registros.forEach((i, o) => {
                    if (o < 20) {
                        $("#registros").innerHTML += `
                        <ion-row class="ion-align-items-center ion-text-center">
                            <ion-col>
                                <img src="http://movetrack.develotion.com/imgs/${i.idActividad}.png">
                            </ion-col>
                            <ion-col>${i.id}</ion-col>
                            <ion-col>${i.idActividad}</ion-col>
                            <ion-col>${i.idUsuario}</ion-col>
                            <ion-col>${i.tiempo}</ion-col>
                            <ion-col>${i.fecha}</ion-col>
                            <ion-col>
                                <ion-button onclick=eliminarActividadRegistro(${i.id})>
                                    <ion-icon color="light" name="trash"></ion-icon>
                                </ion-button>
                            </ion-col>
                        </ion-row>
                    `;  
                    }
                })
            }
            mostrarMensaje("Listado cargado correctamente", undefined, undefined, "success")

        } else {
            cerrarSesion(e.codigo);
        }
    })
    .catch(e => console.log(e))
}

function eliminarActividadRegistro(idRegistro) {
    if (idRegistro==null) throw new Error("Se necesita un ID");

    fetch(urlBase+"/registros.php?idRegistro="+idRegistro, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'apikey': localStorage.getItem("token"),
            'iduser': localStorage.getItem("id")
        }
    })
    .then(e => e.json())
    .then(e => {
        console.log(e)

        let time = 1500;
        if (e.codigo != 200) time=5000;

        mostrarMensaje(e.mensaje, time);
    })
    .catch(e => console.log(e))
}

function tiempoTotalIniciadoSesion() {
    $("#tiempoTotal").innerHTML="";
    $("#tiempoTotal").innerHTML += `
        <ion-item color="success">
            <p style="color: white">Tiempo Total: </p>
        </ion-item>
        <ion-item>
            <p>${localStorage.getItem("tiempoTotal")} Segundos</p>
        </ion-item>
        <ion-item>
            <p>${(Number(localStorage.getItem("tiempoTotal"))/60).toFixed()} Minutos</p>
        </ion-item>
    `;
}