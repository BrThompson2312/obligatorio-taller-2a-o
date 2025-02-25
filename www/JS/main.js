const ruteo = document.querySelector("#ruteo");
const $ = (p) => document.querySelector(p);

const urlBase = 'https://movetrack.develotion.com';

let latitudOrigen = "";
let longitudOrigen = "";

let map;

function solicitarUbicacion() {
    navigator.geolocation.getCurrentPosition(guardarUbicacion, evaluarError);
}

function guardarUbicacion(position) {
    latitudOrigen=position.coords.latitude;
    longitudOrigen=position.coords.longitude;
}

function evaluarError(error) {
    switch(error.code) {
        case 1:
            mostrarMensaje("No se habilitó la geolocalización", undefined, undefined, "danger");
            break;
        case 2:
            mostrarMensaje("No se pudo obtener geolocalización", undefined, undefined, "danger");
            break;
        case 3:
            mostrarMensaje("Se agotó el tiempo para obtener la geolocalización", undefined, undefined, "danger");
            break;
    }
}

inicio();
ocultarSecciones();
eventos();

function inicio() {
    if (localStorage.getItem("token") == null) {
        mostrarMenuLogueado(false);
        ruteo.push("/login");
    } else {
        solicitarUbicacion();
        mostrarMenuLogueado();
        ruteo.push("/");
    }
}

function cargarPaisesSelect() {
    $("#txtResidencia").innerHTML="";
    apiPaises()
    .then(response => {
        response.paises.forEach(e => {
            $("#txtResidencia").innerHTML += `
                <ion-select-option value="${e.id}">${e.name}</ion-select-option>
            `
        })
    })
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
            cargarPaisesSelect();
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
            selectActividades();
            $("#agregarRegistro").style.display = "block";
            break;

        case '/listadoRegistros':
            verificarLogueado();
            $("#listadoRegistros").style.display = "block";
            listadoRegistros();
            break;

        case '/tiempoTotalYDiario':
            verificarLogueado();
            tiempoTotal();
            $("#tiempoTotalYDiario").style.display = "block";
            break;

        case '/mapaUsuarios':
            $("#mapaUsuarios").style.display = "block";
            setTimeout(() => {
                mapaUsuarios();
            }, 2000)
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
        localStorage.clear();
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

        const usuario = {
            "usuario": txtUsuario,
            "password": txtPassword,
            "idPais": txtResidencia
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
                mostrarMensaje(e.mensaje)
            }
        })
        .catch(e => console.log(e))
            
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
    if (residencia == undefined || residencia.trim().length == 0) {
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
    // document.querySelector("#registros").innerHTML = "";
    try {
        let txtActividad = $("#txtActividadRegistro").value;
        let txtTiempo = $("#txtTiempoRegistro").value;
        let txtFecha = $("#txtFechaRegistro").value;
    
        if (txtActividad == "" || txtTiempo == "" || txtFecha == "") {
            throw new Error("Campos vacios")
        }
        if (txtTiempo < 0 || txtTiempo == 0) {
            throw new Error("Ingrese tiempo valido")
        }

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
    $("#gridRegistros").innerHTML="";
    const limit = true;
    mostrarMensaje("Cargando Listado...", undefined, undefined, "warning")
    apiRegistros()
    .then(e => {
        if (e.codigo == 200) {
            if (e.registros.length == 0) {
                $("#listadoRegistros ion-content p").innerHTML = "No hay registros"
            } else {
                $("#listadoRegistros ion-content p").innerHTML = ""
                e.registros.forEach((i, o) => {
                    if (limit) {
                        $("#gridRegistros").innerHTML += `
                        <ion-row class="ion-align-items-center ion-text-center">
                            <ion-col>
                                <img src="https://movetrack.develotion.com/imgs/${i.idActividad}.png">
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

function tiempoTotal() {
    apiRegistros()
    .then(response => {
        let actual = new Date();
        let dia = String(actual.toLocaleDateString("es-ES"));

        let tiempoDiario = 0;
        let tiempoTotal = 0;

        response.registros.forEach(e => {
            if (e.fecha.slice(-2) == dia.slice(0, 2) && e.fecha.slice(0, 4) == dia.slice(5)) {
                tiempoDiario += e.tiempo;
            }
            tiempoTotal += e.tiempo;
        })

        $("#tiempoTotal").innerHTML = `<p>Tiempo Total: ${tiempoTotal} minutos</p>`
        $("#tiempoDiario").innerHTML = `<p>Tiempo Diario: ${tiempoDiario} minutos</p>`

    })
}

function mapaUsuarios() {
    if (map!=null){
        map.remove();
    }
    map = L.map('map').fitWorld();

    fetch(urlBase+"/paises.php", {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(e => e.json())
    .then(response => {

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        L.marker([latitudOrigen, longitudOrigen]).addTo(map).bindPopup("Mi Ubicacion").addTo(map).openPopup();

        usuariosPorPais()
        .then(res2 => {
            if (res2.codigo == 200) {
                response.paises.forEach(pais => {
                    let cantidadUsuarios;
                    for (let k = 0; k < res2.paises.length; k++) {
                        if (res2.paises[k].name == pais.name) {
                            cantidadUsuarios = `País: ${pais.name}, Usuarios: ${String(res2.paises[k].cantidadDeUsuarios)}`;
                            break;
                        }
                    }
                    L.marker([pais.latitude, pais.longitude]).addTo(map).bindPopup(cantidadUsuarios).addTo(map).openPopup();
                })
            } else {
                return cerrarSesion();
            }
        })
    })
    .catch(e => console.log(e))
}

async function usuariosPorPais() {
    try {
        const response = await fetch(urlBase+"/usuariosPorPais.php", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("token"),
                'iduser': localStorage.getItem("id")
            }
        })
        return await response.json();
    } catch (e) {
        return e;
    }
}