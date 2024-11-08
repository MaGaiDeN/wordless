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
    await cargarPalabrasValidas();
    PALABRA = obtenerPalabraAleatoria();
    inicializarTablero();
    inicializarTeclado();
    cargarEstadisticas();
});

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
    teclado.innerHTML = ''; // Limpiar teclado existente
    
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

// Event listener para el teclado físico
document.addEventListener('keydown', (event) => {
    console.log('Tecla presionada:', event.key);
    const key = event.key.toUpperCase();
    
    if (key === 'ENTER') {
        manejarInput('ENTER');
    } else if (key === 'BACKSPACE') {
        manejarInput('⌫');
    } else if (/^[A-ZÑ]$/.test(key)) {
        manejarInput(key);
    }
});

function mostrarMensaje(mensaje, tipo = 'info') {
    const mensajeAnterior = document.querySelector('.mensaje');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje mensaje-${tipo}`;
    mensajeElement.innerHTML = mensaje;
    document.body.appendChild(mensajeElement);
    
    if (tipo === 'error' && !mensaje.includes('Juego terminado')) {
        setTimeout(() => {
            mensajeElement.remove();
        }, 2000);
    }
}

async function verificarIntento() {
    // Verificar que no estemos en un estado finalizado
    if (finalizado) return;

    const casillas = document.querySelectorAll(`.fila-${intentoActual} .casilla`);
    if (!casillas || casillas.length === 0) return;

    const palabraIntento = Array.from(casillas).map(casilla => casilla.textContent).join('');
    
    // Verificar longitud
    if (palabraIntento.length !== LONGITUD) {
        mostrarMensaje('Palabra incompleta', 'error');
        return;
    }

    // Verificar si la palabra existe
    if (!DICCIONARIO.has(palabraIntento)) {
        mostrarMensaje('Palabra no válida', 'error');
        return;
    }

    // Procesar cada letra
    for (let i = 0; i < LONGITUD; i++) {
        const letra = palabraIntento[i];
        const casilla = casillas[i];

        if (!casilla) continue;

        // Determinar el color
        let color = 'gris';
        if (letra === PALABRA[i]) {
            color = 'verde';
        } else if (PALABRA.includes(letra)) {
            color = 'amarillo';
        }

        // Aplicar clase a la casilla
        casilla.classList.add(color);

        // Aplicar clase a la tecla si existe
        const tecla = document.querySelector(`button[data-key="${letra}"]`);
        if (tecla) {
            if (color === 'verde') {
                tecla.classList.remove('amarillo');
                tecla.classList.add('verde');
            } else if (color === 'amarillo' && !tecla.classList.contains('verde')) {
                tecla.classList.add('amarillo');
            } else if (color === 'gris' && !tecla.classList.contains('verde') && !tecla.classList.contains('amarillo')) {
                tecla.classList.add('gris');
            }
        }

        // Animación
        setTimeout(() => {
            casilla.classList.add('revelada');
        }, i * 100);
    }

    // Verificar victoria o derrota
    if (palabraIntento === PALABRA) {
        setTimeout(() => {
            actualizarEstadisticas(true, intentoActual + 1);
            mostrarMensaje('¡Ganaste! <button onclick="reiniciarJuego()">Jugar de nuevo</button>', 'success');
            finalizado = true;
        }, LONGITUD * 100);
        return;
    }

    if (intentoActual === INTENTOS - 1) {
        setTimeout(() => {
            actualizarEstadisticas(false, 6);
            mostrarMensaje(`¡Juego terminado! La palabra era: ${PALABRA} <button onclick="reiniciarJuego()">Jugar de nuevo</button>`, 'error');
            finalizado = true;
        }, LONGITUD * 100);
        return;
    }

    intentoActual++;
    letraActual = 0;
}

function contarPalabras() {
    console.log(`Total de palabras disponibles: ${PALABRAS_VALIDAS.size}`);
}

function reiniciarJuego() {
    // Reiniciar variables
    intentoActual = 0;
    letraActual = 0;
    finalizado = false;
    PALABRA = obtenerPalabraAleatoria();
    
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
    
    // Limpiar el mensaje si existe
    const mensajeAnterior = document.querySelector('.mensaje');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
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