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
    const casillas = document.querySelectorAll(`.fila-${intentoActual} .casilla`);
    const palabraIntento = Array.from(casillas).map(casilla => casilla.textContent).join('');
    
    // Primero verificamos si es la palabra correcta
    if (palabraIntento === PALABRA) {
        // Colorear las casillas
        for (let i = 0; i < LONGITUD; i++) {
            const casilla = casillas[i];
            casilla.classList.add('verde');
            setTimeout(() => {
                casilla.classList.add('revelada');
            }, i * 100);
        }
        
        setTimeout(() => {
            actualizarEstadisticas(true, intentoActual + 1);
            mostrarMensaje('¡Ganaste! <button onclick="reiniciarJuego()">Jugar de nuevo</button>', 'success');
            finalizado = true;
        }, LONGITUD * 100);
        return;
    }

    // Si no es la palabra correcta, verificamos que sea una palabra válida
    if (!DICCIONARIO.has(palabraIntento)) {
        mostrarMensaje('Palabra no válida', 'error');
        return;
    }

    // Resto de la lógica para colorear las casillas...
    for (let i = 0; i < LONGITUD; i++) {
        const letra = palabraIntento[i];
        const casilla = casillas[i];
        const tecla = document.querySelector(`button[data-key="${letra}"]`);
        
        if (letra === PALABRA[i]) {
            casilla.classList.add('verde');
            if (tecla) {
                tecla.classList.remove('amarillo');
                tecla.classList.add('verde');
            }
        } else if (PALABRA.includes(letra)) {
            casilla.classList.add('amarillo');
            if (tecla && !tecla.classList.contains('verde')) {
                tecla.classList.add('amarillo');
            }
        } else {
            casilla.classList.add('gris');
            if (tecla) {
                tecla.classList.add('gris');
            }
        }
        
        setTimeout(() => {
            casilla.classList.add('revelada');
        }, i * 100);
    }

    // Verificar si se acabaron los intentos
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

// Asegurarnos de que el DOM está cargado antes de inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando juego...');
    inicializarJuego();
});

function inicializarJuego() {
    console.log('Inicializando juego...');
    PALABRA = obtenerPalabraAleatoria();
    console.log('Palabra seleccionada:', PALABRA);
    
    inicializarAyuda();
    inicializarTablero();
    inicializarTeclado();
}