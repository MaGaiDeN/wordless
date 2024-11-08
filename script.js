async function cargarPalabrasValidas() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/arturo-source/buscar-palabras-en-castellano/refs/heads/main/todas_las_palabras_esp.txt');
        const texto = await response.text();
        
        // Dividir el texto en palabras y filtrar las de 5 letras
        const palabras = texto.split('\n')
            .map(palabra => palabra.trim().toUpperCase())
            .filter(palabra => palabra.length === 5 && /^[A-ZÑ]+$/.test(palabra));
        
        PALABRAS_VALIDAS = new Set(palabras);
        console.log(`Cargadas ${PALABRAS_VALIDAS.size} palabras válidas`);
    } catch (error) {
        console.error('Error al cargar las palabras:', error);
        // En caso de error, usar un conjunto básico de palabras
        PALABRAS_VALIDAS = new Set(['GATOS', 'PERRO', 'CASA', 'MESA']);
    }
}

// Asegúrate de que PALABRAS_VALIDAS sea declarada como let en lugar de const
let PALABRAS_VALIDAS = new Set();

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, iniciando juego...');
    await cargarPalabrasValidas();
    initializeGame();
});

function initializeGame() {
    console.log('Inicializando juego...');
    
    // Inicializar variables
    gameStarted = false;
    timeLeft = 120;
    
    // Obtener palabra y configurar juego
    PALABRA = obtenerPalabraAleatoria();
    console.log('Palabra seleccionada:', PALABRA);
    
    // Inicializar componentes
    inicializarTablero();
    inicializarTeclado();
    inicializarAyuda();
    cargarEstadisticas();
    
    // Ocultar teclado inicialmente
    const teclado = document.getElementById('teclado');
    if (teclado) {
        teclado.style.display = 'none';
    }
    
    // Configurar botón de inicio
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
        console.log('Evento click agregado al botón');
    }
}

function startGame() {
    if (gameStarted) return;
    console.log('Iniciando juego...');
    
    gameStarted = true;
    timeLeft = 120;
    finalizado = false;
    
    // Ocultar el botón comenzar
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.style.display = 'none';
        console.log('Botón comenzar ocultado');
    }
    
    // Mostrar timer
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = '2:00';
        timerElement.classList.add('visible');
    }
    
    // Mostrar teclado
    const teclado = document.getElementById('teclado');
    if (teclado) {
        teclado.style.display = 'flex';
        console.log('Teclado mostrado');
    }
    
    // Crear y activar input móvil
    crearInputMovil();
    
    iniciarTimer();
}

function crearInputMovil() {
    // Eliminar input anterior si existe
    const inputAnterior = document.getElementById('inputMovil');
    if (inputAnterior) {
        inputAnterior.remove();
    }
    
    // Crear nuevo input
    const input = document.createElement('input');
    input.id = 'inputMovil';
    input.type = 'text';
    input.maxLength = 1;
    input.autocomplete = 'off';
    input.spellcheck = false;
    
    // Estilos para ocultar el input pero mantenerlo funcional
    const inputStyles = `
        #inputMovil {
            position: fixed;
            opacity: 0;
            pointer-events: none;
            top: 0;
            left: 0;
            width: 1px;
            height: 1px;
            font-size: 16px; /* Previene zoom en iOS */
        }
    `;
    
    // Añadir estilos al style existente
    style.textContent += inputStyles;
    
    // Manejar input
    input.addEventListener('input', (e) => {
        const valor = e.target.value.toUpperCase();
        if (/^[A-ZÑ]$/.test(valor)) {
            manejarInput(valor);
        }
        input.value = ''; // Limpiar para siguiente letra
    });
    
    // Manejar backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            manejarInput('⌫');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            manejarInput('ENTER');
        }
    });
    
    document.body.appendChild(input);
    
    // Mantener el focus en el input
    input.focus();
    document.addEventListener('click', () => {
        if (gameStarted && !finalizado) {
            input.focus();
        }
    });
}

function iniciarTimer() {
    console.log('Iniciando timer');
    timeLeft = 120;
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = '2:00';
        timerElement.classList.remove('warning');
    }
    
    timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Añadir clase warning cuando quede poco tiempo (30 segundos)
            if (timeLeft <= 30 && !timerElement.classList.contains('warning')) {
                timerElement.classList.add('warning');
            }
        }
        
        if (timeLeft <= 0) {
            console.log('Tiempo agotado');
            mostrarMensajeTimeOut();
        }
    }, 1000);
}

function mostrarMensajeTimeOut() {
    console.log('Mostrando mensaje de tiempo agotado');
    finalizarJuego(false);
}

function endGame(timeOut = false) {
    console.log('Finalizando juego...');
    clearInterval(timer);
    gameStarted = false;
    finalizado = true;
    
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.disabled = false;
    }
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = '1:00';
    }
    
    // Ocultar teclado
    const teclado = document.getElementById('teclado');
    if (teclado) {
        teclado.style.display = 'none';
        console.log('Teclado ocultado');
    }

    // Crear el mensaje modal
    const modalMensaje = document.createElement('div');
    modalMensaje.className = 'modal-mensaje';
    modalMensaje.innerHTML = `
        <div class="modal-contenido">
            <h2>${timeOut ? '¡Se acabó el tiempo!' : '¡Juego terminado!'}</h2>
            <p>La palabra era: <strong>${PALABRA}</strong></p>
            <button onclick="reiniciarJuego()" class="boton-reiniciar">Jugar de nuevo</button>
        </div>
    `;
    document.body.appendChild(modalMensaje);

    // Actualizar estadísticas
    actualizarEstadisticas(false, 6);
}

// Unificar todos los estilos en una sola declaración al inicio
const style = document.createElement('style');
style.textContent = `
    .modal-mensaje {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-contenido {
        background-color: #fff;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
    }

    .modal-contenido h2 {
        color: #dc3545;
        margin-bottom: 20px;
        font-size: 1.5em;
    }

    .modal-contenido p {
        color: #333;
        margin-bottom: 20px;
        font-size: 1.2em;
    }

    .modal-contenido strong {
        color: #28a745;
        font-size: 1.3em;
        font-weight: bold;
    }

    .boton-reiniciar {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        font-size: 1.1em;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .boton-reiniciar:hover {
        background-color: #0056b3;
    }

    .mensaje-temporal {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    }

    .mensaje-temporal.error {
        background-color: rgba(220, 53, 69, 0.9);
    }

    .mensaje-temporal.info {
        background-color: rgba(40, 167, 69, 0.9);
    }

    @keyframes fadeInOut {
        0% { opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
    }

    .keyboard.hidden {
        display: none !important;
    }

    .keyboard:not(.hidden) {
        display: flex;
    }

    #timer {
        display: none;
        font-family: 'Roboto Mono', monospace;
        font-size: 2.5rem;
        font-weight: bold;
        color: #2c3e50;
        background: linear-gradient(145deg, #f0f0f0, #ffffff);
        padding: 15px 25px;
        border-radius: 15px;
        box-shadow: 5px 5px 15px rgba(0,0,0,0.1),
                    -5px -5px 15px rgba(255,255,255,0.8);
        margin: 20px auto;
        text-align: center;
        transition: all 0.3s ease;
    }

    #timer.visible {
        display: inline-block;
    }

    #timer.warning {
        color: #e74c3c;
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

function verificarPalabra(palabra) {
    const palabraUpperCase = palabra.toUpperCase();
    return PALABRAS_VALIDAS.has(palabraUpperCase);
}

const PALABRAS_JUEGO = [
    'AVENA', 'BRAZO', 'CALOR', 'DIETA', 'FALSO',
    'GENTE', 'HOJAS', 'IDEAS', 'JUGAR', 'LUGAR',
    'MAREA', 'NIÑOS', 'OBVIO', 'PACTO', 'QUIEN',
    'RAMAS', 'SALUD', 'TANGO', 'UNIDO', 'VACAS',
    'ABAJO', 'BESOS', 'CIELO', 'DIGNO', 'FELIZ',
    'GAFAS', 'HUEVO', 'IDEAL', 'JUSTO', 'LENTO',
    'MANOS', 'NECIO', 'OJALA', 'PLAZA', 'QUESO',
    'RATON', 'SABER', 'TENIS', 'USTED', 'VERDE',
    'AMIGA', 'BUENO', 'CERDO', 'DURAR', 'FUEGO',
    'GRANO', 'HIELO', 'ISLAS', 'LIMON', 'MIEDO'
];

function obtenerPalabraAleatoria() {
    const indice = Math.floor(Math.random() * PALABRAS_JUEGO.length);
    return PALABRAS_JUEGO[indice];
}

const INTENTOS = 6;
const LONGITUD = 5;

let intentoActual = 0;
let letraActual = 0;
let finalizado = false;

const palabrasCache = new Map();

const estadisticas = {
    jugadas: 0,
    victorias: 0,
    racha: 0,
    mejorRacha: 0,
    distribucion: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    }
};

function cargarEstadisticas() {
    const statsGuardadas = localStorage.getItem('wordleStats');
    if (statsGuardadas) {
        Object.assign(estadisticas, JSON.parse(statsGuardadas));
    }
}

function guardarEstadisticas() {
    localStorage.setItem('wordleStats', JSON.stringify(estadisticas));
}

function actualizarEstadisticas(victoria, intentos) {
    estadisticas.jugadas++;
    
    if (victoria) {
        estadisticas.victorias++;
        estadisticas.racha++;
        estadisticas.distribucion[intentos]++;
        
        if (estadisticas.racha > estadisticas.mejorRacha) {
            estadisticas.mejorRacha = estadisticas.racha;
        }
    } else {
        estadisticas.racha = 0;
    }
    
    guardarEstadisticas();
}

function inicializarTablero() {
    console.log('Inicializando tablero...');
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = ''; // Limpiar tablero existente

    for (let i = 0; i < INTENTOS; i++) {
        const fila = document.createElement('div');
        fila.className = `fila fila-${i}`;
        
        for (let j = 0; j < LONGITUD; j++) {
            const casilla = document.createElement('div');
            casilla.className = 'casilla';
            fila.appendChild(casilla);
        }
        
        tablero.appendChild(fila);
    }
}

function inicializarTeclado() {
    console.log('Inicializando teclado...');
    const teclado = document.getElementById('teclado');
    teclado.innerHTML = '';
    
    const filas = [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L','Ñ'],
        ['ENTER','Z','X','C','V','B','N','M','⌫']
    ];
    
    filas.forEach(fila => {
        const filaTeclado = document.createElement('div');
        filaTeclado.className = 'fila-teclado';
        
        fila.forEach(letra => {
            const tecla = document.createElement('button');
            tecla.className = 'tecla';
            tecla.textContent = letra;
            tecla.setAttribute('data-key', letra);
            tecla.onclick = () => manejarInput(letra);
            filaTeclado.appendChild(tecla);
        });
        
        teclado.appendChild(filaTeclado);
    });
}

function mostrarAyuda() {
    const tooltip = document.querySelector('.tooltip');
    tooltip.style.display = 'block';
    
    // Agregar listener para el botón de cerrar
    const cerrarBtn = tooltip.querySelector('.cerrar-tooltip');
    cerrarBtn.onclick = () => {
        tooltip.style.display = 'none';
    };
    
    // Cerrar al hacer clic fuera del tooltip
    document.addEventListener('click', function cerrarTooltip(e) {
        if (!tooltip.contains(e.target) && !document.querySelector('.ayuda-btn').contains(e.target)) {
            tooltip.style.display = 'none';
            document.removeEventListener('click', cerrarTooltip);
        }
    });
}

async function verificarPalabraRAE(palabra) {
    palabra = palabra.toLowerCase();
    
    // Verificar si la palabra está en caché
    if (palabrasCache.has(palabra)) {
        return palabrasCache.get(palabra);
    }
    
    try {
        const response = await fetch(`https://dle.rae.es/data/${palabra}`);
        const data = await response.json();
        const existe = data.res && data.res.length > 0;
        
        // Guardar en caché
        palabrasCache.set(palabra, existe);
        
        return existe;
    } catch (error) {
        console.error('Error al verificar la palabra:', error);
        return false;
    }
}

function manejarInput(letra) {
    console.log('Input recibido:', letra);
    if (finalizado) {
        console.log('Juego finalizado, input ignorado');
        return;
    }

    if (letra === 'ENTER') {
        console.log('Enter presionado, letraActual:', letraActual);
        if (letraActual === LONGITUD) {
            console.log('Verificando intento...');
            verificarIntento();
        } else {
            mostrarMensaje('Palabra incompleta', 'error');
        }
        return;
    }

    if (letra === '⌫' || letra === 'BACKSPACE') {
        if (letraActual > 0) {
            letraActual--;
            const casilla = document.querySelector(`.fila-${intentoActual} .casilla:nth-child(${letraActual + 1})`);
            if (casilla) {
                casilla.textContent = '';
            }
        }
        return;
    }

    if (letraActual < LONGITUD) {
        console.log('Agregando letra:', letra, 'en posición:', letraActual);
        const casilla = document.querySelector(`.fila-${intentoActual} .casilla:nth-child(${letraActual + 1})`);
        if (casilla) {
            casilla.textContent = letra;
            letraActual++;
        }
    }
}

// Función principal para manejar todas las entradas
function handleInput(key) {
    if (!gameStarted) {
        return false; // Asegurarse de que nada suceda si el juego no ha comenzado
    }
    
    if (key === 'ENTER') {
        handleEnter();
    } else if (key === 'BACKSPACE' || key === '⌫') {
        handleBackspace();
    } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
    }
}

// Evento para teclado físico
document.addEventListener('keydown', (event) => {
    if (!gameStarted) return;
    
    const key = event.key.toUpperCase();
    console.log('Tecla presionada:', key);
    
    // Mapear la tecla Backspace a ⌫
    if (key === 'BACKSPACE') {
        manejarInput('⌫');
        return;
    }
    
    // Mapear la tecla Enter
    if (key === 'ENTER') {
        manejarInput('ENTER');
        return;
    }
    
    // Solo procesar letras válidas (incluyendo Ñ)
    if (/^[A-ZÑ]$/.test(key)) {
        manejarInput(key);
    }
});

// Evento para teclado virtual
document.querySelectorAll('.keyboard-row button').forEach(button => {
    button.addEventListener('click', (e) => {
        if (!gameStarted) {
            e.preventDefault();
            return;
        }
        const key = button.textContent;
        handleInput(key === '⌫' ? 'BACKSPACE' : key);
    });
});

function mostrarMensaje(texto, tipo = 'info') {
    console.log('Mostrando mensaje:', texto, tipo);
    
    // Eliminar mensaje anterior si existe
    const mensajeAnterior = document.querySelector('.mensaje-temporal');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
    
    // Crear nuevo mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje-temporal ${tipo}`;
    mensajeElement.textContent = texto;
    
    // Insertar el mensaje en el DOM
    document.body.appendChild(mensajeElement);
    
    // Eliminar el mensaje después de 2 segundos
    setTimeout(() => {
        if (mensajeElement.parentNode) {
            mensajeElement.remove();
        }
    }, 2000);
}

function obtenerIntentoActual() {
    console.log('Obteniendo intento actual...');
    let intento = '';
    const filaCasillas = document.querySelectorAll(`.fila-${intentoActual} .casilla`);
    
    filaCasillas.forEach(casilla => {
        intento += casilla.textContent;
    });
    
    console.log('Intento obtenido:', intento);
    return intento;
}

async function verificarIntento() {
    console.log('Verificando intento...');
    const intento = obtenerIntentoActual();
    
    if (intento.length !== LONGITUD) {
        console.log('Intento incompleto');
        mostrarMensaje('Palabra incompleta', 'error');
        return;
    }

    if (!PALABRAS_VALIDAS.has(intento)) {
        console.log('Palabra no válida:', intento);
        mostrarMensaje('Palabra no válida', 'error');
        return;
    }

    console.log('Evaluando intento:', intento);
    const resultado = evaluarIntento(intento);
    
    // Animar y mostrar el resultado
    const casillas = document.querySelectorAll(`.fila-${intentoActual} .casilla`);
    
    for (let i = 0; i < LONGITUD; i++) {
        const letra = intento[i];
        const casilla = casillas[i];
        const color = resultado[i];
        
        setTimeout(() => {
            casilla.classList.add(color);
            actualizarColorTecla(letra, color);
        }, i * 100);
    }

    // Verificar si ganó o perdió después de la animación
    setTimeout(() => {
        if (intento === PALABRA) {
            finalizarJuego(true);
        } else if (intentoActual === INTENTOS - 1) {
            finalizarJuego(false);
        } else {
            intentoActual++;
            letraActual = 0;
        }
    }, LONGITUD * 100);
}

function finalizarJuego(victoria) {
    console.log('Finalizando juego, victoria:', victoria);
    clearInterval(timer); // Detener el temporizador
    finalizado = true;
    gameStarted = false;

    // Ocultar timer
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.classList.remove('visible');
    }

    // Eliminar input móvil
    const inputMovil = document.getElementById('inputMovil');
    if (inputMovil) {
        inputMovil.remove();
    }

    // Mostrar mensaje final
    const modalMensaje = document.createElement('div');
    modalMensaje.className = 'modal-mensaje';
    modalMensaje.innerHTML = `
        <div class="modal-contenido">
            <h2>${victoria ? '¡Felicidades!' : '¡Juego terminado!'}</h2>
            <p>La palabra era: <strong>${PALABRA}</strong></p>
            <button onclick="reiniciarJuego()" class="boton-reiniciar">Jugar de nuevo</button>
        </div>
    `;
    document.body.appendChild(modalMensaje);

    // Actualizar estadísticas
    actualizarEstadisticas(victoria, intentoActual + 1);
}

function reiniciarJuego() {
    console.log('Reiniciando juego...');
    
    // Mostrar timer con tiempo inicial
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.style.display = 'inline-block';
        timerElement.textContent = '2:00';
        timerElement.classList.remove('warning');
    }
    
    // Limpiar el timer anterior
    clearInterval(timer);
    
    // Eliminar el modal si existe
    const modalMensaje = document.querySelector('.modal-mensaje');
    if (modalMensaje) {
        modalMensaje.remove();
    }
    
    // Reiniciar variables
    intentoActual = 0;
    letraActual = 0;
    finalizado = false;
    gameStarted = true;
    timeLeft = 120;
    
    // Obtener nueva palabra
    PALABRA = obtenerPalabraAleatoria();
    console.log('Nueva palabra seleccionada:', PALABRA);
    
    // Limpiar el tablero
    const casillas = document.querySelectorAll('.casilla');
    casillas.forEach(casilla => {
        casilla.textContent = '';
        casilla.className = 'casilla';
    });
    
    // Limpiar los estilos del teclado
    const teclas = document.querySelectorAll('.tecla');
    teclas.forEach(tecla => {
        tecla.classList.remove('verde', 'amarillo', 'gris');
    });
    
    // Mostrar teclado
    const teclado = document.getElementById('teclado');
    if (teclado) {
        teclado.style.display = 'flex';
    }
    
    // Recrear input móvil
    crearInputMovil();
    
    // Iniciar nuevo timer
    iniciarTimer();
    
    console.log('Juego reiniciado completamente');
}

function mostrarEstadisticas() {
    const porcentajeVictorias = ((estadisticas.victorias / estadisticas.jugadas) * 100) || 0;
    
    const modal = document.createElement('div');
    modal.className = 'estadisticas-modal';
    modal.innerHTML = `
        <h2>Estadísticas</h2>
        <div class="stats-grid">
            <div>
                <h3>${estadisticas.jugadas}</h3>
                <p>Jugadas</p>
            </div>
            <div>
                <h3>${porcentajeVictorias.toFixed(1)}%</h3>
                <p>Victorias</p>
            </div>
            <div>
                <h3>${estadisticas.racha}</h3>
                <p>Racha actual</p>
            </div>
            <div>
                <h3>${estadisticas.mejorRacha}</h3>
                <p>Mejor racha</p>
            </div>
        </div>
        <h3>Distribución</h3>
        <div class="distribucion">
            ${Object.entries(estadisticas.distribucion)
                .map(([intento, cantidad]) => `
                    <div class="distribucion-fila">
                        <span>${intento}</span>
                        <div class="distribucion-barra" style="width: ${(cantidad / estadisticas.victorias) * 100}%">
                            ${cantidad}
                        </div>
                    </div>
                `).join('')}
        </div>
        <button onclick="this.parentElement.remove()">Cerrar</button>
    `;
    
    document.body.appendChild(modal);
}

function rendirse() {
    if (finalizado) return;
    
    finalizado = true;
    actualizarEstadisticas(false, 6);
    mostrarMensaje(`Te has rendido. La palabra era: ${PALABRA} <button onclick="reiniciarJuego()">Jugar de nuevo</button>`, 'error');
}

// Cargar el diccionario de palabras válidas
let DICCIONARIO = new Set();

fetch('https://raw.githubusercontent.com/arturo-source/buscar-palabras-en-castellano/refs/heads/main/todas_las_palabras_esp.txt')
    .then(response => response.text())
    .then(data => {
        DICCIONARIO = new Set(data.split('\n').map(palabra => palabra.trim().toUpperCase()));
    });

function inicializarAyuda() {
    console.log('Inicializando ayuda...');
    const ayudaContainer = document.getElementById('ayuda-container');
    
    // Crear el botón de ayuda
    const ayudaBtn = document.createElement('button');
    ayudaBtn.className = 'ayuda-btn';
    ayudaBtn.innerHTML = '?';
    ayudaBtn.onclick = mostrarAyuda;
    
    // Crear el tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.display = 'none';
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h3>Cómo jugar</h3>
            <p>Adivina la palabra en 6 intentos o menos.</p>
            <p>Cada intento debe ser una palabra válida de 5 letras.</p>
            <p>Luego de cada intento, el color de los cuadros cambiarán para mostrar que tan cerca estás de acertar la palabra.</p>
            
            <h4>Ejemplos:</h4>
            <div class="ejemplo">
                <div class="ejemplo-fila">
                    <div class="casilla">A</div>
                    <div class="casilla verde">S</div>
                    <div class="casilla">A</div>
                    <div class="casilla">D</div>
                    <div class="casilla">O</div>
                </div>
                <p>La letra S está en la palabra y en la posición correcta</p>
            </div>
            
            <div class="ejemplo">
                <div class="ejemplo-fila">
                    <div class="casilla">C</div>
                    <div class="casilla">E</div>
                    <div class="casilla">B</div>
                    <div class="casilla">A</div>
                    <div class="casilla amarillo">R</div>
                </div>
                <p>La letra R está en la palabra, pero en la posición incorrecta</p>
            </div>
            
            <div class="ejemplo">
                <div class="ejemplo-fila">
                    <div class="casilla">L</div>
                    <div class="casilla">E</div>
                    <div class="casilla gris">M</div>
                    <div class="casilla">U</div>
                    <div class="casilla">R</div>
                </div>
                <p>La letra M no se encuentra en la palabra</p>
            </div>
            
            <button class="cerrar-tooltip" onclick="cerrarTooltip()">Entendido</button>
        </div>
    `;
    
    ayudaContainer.appendChild(ayudaBtn);
    ayudaContainer.appendChild(tooltip);
}

// Agregar la función cerrarTooltip al scope global
function cerrarTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Modificar la función mostrarAyuda para alternar la visibilidad
function mostrarAyuda() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        
        // Agregar event listener para cerrar al hacer clic fuera
        document.addEventListener('click', function cerrarAlClickFuera(e) {
            if (!tooltip.contains(e.target) && !document.querySelector('.ayuda-btn').contains(e.target)) {
                tooltip.style.display = 'none';
                document.removeEventListener('click', cerrarAlClickFuera);
            }
        });
    }
}

function handleKeyPress(key) {
    if (!gameStarted) return;
    
    if (currentTile >= 5) return;
    const tile = document.querySelector(`.tile[data-index="${currentRow}${currentTile}"]`);
    if (!gameStarted || !tile) return; // Doble verificación
    
    tile.textContent = key;
    tile.classList.add('filled');
    currentTile++;
}

// Asegurarnos de que los eventos del teclado virtual también están bien protegidos
document.querySelectorAll('.keyboard-row button').forEach(button => {
    button.addEventListener('click', (e) => {
        if (!gameStarted) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        const key = button.textContent;
        if (gameStarted) { // Verificación adicional
            handleInput(key === '⌫' ? 'BACKSPACE' : key);
        }
    });
});

function handleBackspace() {
    if (!gameStarted) return;
    
    if (currentTile > 0) {
        currentTile--;
        const tile = document.querySelector(`.tile[data-index="${currentRow}${currentTile}"]`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

function handleEnter() {
    if (!gameStarted) return;
    
    // ... resto del código de handleEnter ...
}

// Variables globales al inicio del archivo
let gameStarted = false;
let timer;
let timeLeft = 60;
let currentRow = 0;
let currentTile = 0;

function evaluarIntento(intento) {
    console.log('Evaluando intento:', intento, 'Palabra objetivo:', PALABRA);
    const resultado = new Array(LONGITUD).fill('gris');
    
    // Crear un mapa de las letras en la palabra objetivo
    const letrasObjetivo = new Map();
    for (let i = 0; i < PALABRA.length; i++) {
        const letra = PALABRA[i];
        if (!letrasObjetivo.has(letra)) {
            letrasObjetivo.set(letra, { total: 1, posiciones: [i] });
        } else {
            const info = letrasObjetivo.get(letra);
            info.total++;
            info.posiciones.push(i);
        }
    }
    
    console.log('Estado inicial:', Object.fromEntries(letrasObjetivo));
    
    // Primera pasada: marcar las letras en posición correcta (verde)
    for (let i = 0; i < LONGITUD; i++) {
        const letra = intento[i];
        if (letra === PALABRA[i]) {
            resultado[i] = 'verde';
            const info = letrasObjetivo.get(letra);
            info.total--;
            info.posiciones = info.posiciones.filter(pos => pos !== i);
            console.log(`Marcando verde: ${letra} en posición ${i}. Quedan: ${info.total}`);
        }
    }
    
    console.log('Después de verdes:', Object.fromEntries(letrasObjetivo));
    
    // Segunda pasada: marcar las letras en posición incorrecta (amarillo)
    for (let i = 0; i < LONGITUD; i++) {
        if (resultado[i] === 'gris') {
            const letra = intento[i];
            const info = letrasObjetivo.get(letra);
            
            if (info && info.total > 0) {
                // Solo marcar como amarillo si:
                // 1. Quedan ocurrencias disponibles
                // 2. La letra no está ya en su posición correcta
                resultado[i] = 'amarillo';
                info.total--;
                console.log(`Marcando amarillo: ${letra} en posición ${i}. Quedan: ${info.total}`);
            } else {
                console.log(`Marcando gris: ${letra} en posición ${i}. No disponible o no existe`);
            }
        }
    }
    
    console.log('Resultado final:', resultado);
    return resultado;
}

function actualizarColorTecla(letra, color) {
    console.log(`Actualizando color de tecla ${letra} a ${color}`);
    const teclas = document.querySelectorAll('.tecla');
    
    teclas.forEach(tecla => {
        if (tecla.textContent === letra) {
            // Solo actualizar si el nuevo color es más prioritario
            if (color === 'verde') {
                tecla.className = 'tecla verde';
            } else if (color === 'amarillo' && !tecla.classList.contains('verde')) {
                tecla.className = 'tecla amarillo';
            } else if (!tecla.classList.contains('verde') && 
                       !tecla.classList.contains('amarillo')) {
                tecla.className = 'tecla gris';
            }
        }
    });
}

// Añadir estilos responsivos
const responsiveStyles = `
    @media (max-width: 768px) {
        #juego {
            width: 100%;
            max-width: 100%;
            padding: 10px;
            margin: 0;
        }

        .tablero {
            width: 100%;
            max-width: 350px;
            margin: 10px auto;
        }

        .fila {
            display: flex;
            justify-content: center;
            gap: 5px;
            margin: 5px 0;
        }

        .casilla {
            width: calc(20% - 10px);
            height: 45px;
            font-size: 1.5rem;
            border-radius: 8px;
        }

        #teclado {
            width: 100%;
            max-width: 500px;
            margin: 10px auto;
            padding: 5px;
        }

        .fila-teclado {
            display: flex;
            justify-content: center;
            gap: 3px;
            margin: 3px 0;
        }

        .tecla {
            min-width: 25px;
            height: 45px;
            font-size: 1rem;
            margin: 2px;
            padding: 5px;
            border-radius: 5px;
        }

        #timer {
            font-size: 2rem;
            padding: 10px 20px;
            margin: 15px auto;
        }

        .modal-contenido {
            width: 85%;
            max-width: 300px;
            padding: 20px;
            margin: 10px;
        }

        .mensaje-temporal {
            width: 80%;
            font-size: 0.9rem;
            padding: 8px 16px;
        }

        /* Ajustes para evitar desbordamiento */
        body {
            overflow-x: hidden;
            margin: 0;
            padding: 10px;
        }

        /* Ajustes para el header */
        header {
            padding: 10px;
            margin-bottom: 10px;
        }

        h1 {
            font-size: 1.8rem;
            margin: 5px 0;
        }

        /* Ajustes para el footer */
        footer {
            padding: 10px;
            font-size: 0.8rem;
        }
    }

    /* Ajustes específicos para pantallas muy pequeñas */
    @media (max-width: 320px) {
        .casilla {
            height: 40px;
            font-size: 1.3rem;
        }

        .tecla {
            height: 40px;
            font-size: 0.9rem;
            padding: 3px;
        }

        #timer {
            font-size: 1.8rem;
            padding: 8px 16px;
        }
    }
`;

// Añadir los estilos responsivos a los existentes
style.textContent += responsiveStyles;