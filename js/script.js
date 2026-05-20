// ==========================================
// VARIABLES GLOBALES
// ==========================================
let selectActual = null;
let filaEditando = null;
let contadorMesas = 0;
let zoomLevel = 1.0;
let menuChartInstance = null;

    // ==========================================
    // LOGIN
    // ==========================================

$('#form-login').on('submit', function(e) {
    e.preventDefault(); 

    // Limpiamos cualquier error viejo al volver a intentar
    $('#mensaje-error').text('');

    let correo = $('#correo-login').val();
    let password = $('#password-login').val();

    $.ajax({
        url: 'php/login.php',
        method: 'POST',
        data: {
            correo: correo,
            password: password
        },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                window.location.href = 'dashboard.html';
            } else {
                // En lugar de alert(), inyectamos el texto en el HTML
                $('#mensaje-error').text(response.message);
            }
        },
        error: function() {
            $('#mensaje-error').text("Error al comunicarse con el servidor.");
        }
    });
});

$(document).ready(function() {
    
    // ==========================================
    // 1. LÓGICA PARA: dashboard.html
    // ==========================================
    if ($('#contenedor-eventos').length > 0) {
        
        $('#btn-crear-evento').click(function() { 
            new bootstrap.Modal('#modalCrearEvento').show(); 
        });

        $('#btn-guardar-evento').click(function() {
            const nombre = $('#nombre-ev').val();
            const fecha = $('#fecha-ev').val();
            const lugar = $('#lugar-ev').val();

            if(!nombre || !fecha || !lugar) return alert("Completa los campos.");

            const eventDate = new Date(fecha + 'T00:00:00'); 
            const today = new Date();
            today.setHours(0,0,0,0);
            
            let statusBadge = (eventDate < today) ? `<span class=\"badge bg-secondary mb-2 border\">Inactivo (Finalizado)</span>` : `<span class=\"badge bg-success mb-2\">Activo</span>`;
            let extraClass = (eventDate < today) ? 'inactivo' : ''; 

            // Implementación de logica BackEnd            
            $.ajax({
                url: 'php/crear_evento.php',
                method: 'POST',
                data: {
                    nombre: nombre,
                    fecha: fecha,
                    lugar: lugar
                },
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        alert(response.message); // 

                        //Cerramos el modal de Bootstrap
                        const modalElement = document.getElementById('modalCrearEvento');
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        if (modalInstance) {
                            modalInstance.hide();
                        }

                        //Limpiamos las cajas
                        $('#nombre-ev').val('');
                        $('#fecha-ev').val('');
                        $('#lugar-ev').val('');
                        
                        cargarEventos();
                        
                    } else {
                        alert("Error al guardar en BD: " + response.message);
                    }
                },
                error: function() {
                    alert("No se pudo conectar con el servidor PHP.");
                }
            });
            
        });
    }
    
    // ==========================================
    // 2. LÓGICA PARA: gestion.html
    // ==========================================
    if ($('#eventTabs').length > 0) {
        
        // TRUCO: Cargar el nombre del evento simulado desde LocalStorage
        const eventoSimulado = localStorage.getItem('eventoMockNombre') || 'Boda de Carlos';
        $('#display-event-name').text(eventoSimulado);
        $('#edit-nombre').val(eventoSimulado);

        $('#btn-eliminar-evento').click(function() {
            if(confirm("¿Estás seguro de eliminar todo el evento? Esta acción no se puede deshacer.")) {
                window.location.href = 'dashboard.html'; 
            }
        });

        // --- MENÚS DINÁMICOS ---
        $('#btn-add-menu-card').click(function() {
            const menuName = $('#input-new-menu').val().trim();
            if(menuName !== "") {
                const cardHtml = `
                    <div class="col-md-4 menu-card-item">
                        <div class="card border-0 shadow-sm h-100" style="background-color: #fdf2f8;">
                            <div class="card-body d-flex justify-content-between align-items-center p-3">
                                <div><i class="bi bi-cup-hot text-primary-custom me-2"></i><span class="fw-medium text-dark menu-name-span">${menuName}</span></div>
                                <button class="btn btn-sm btn-outline-danger border-0 remove-menu-card"><i class="bi bi-trash3"></i></button>
                            </div>
                        </div>
                    </div>`;
                $('#menu-cards-container').append(cardHtml);
                $('#input-new-menu').val('');
            }
        });

        $(document).on('click', '.remove-menu-card', function() {
            $(this).closest('.menu-card-item').fadeOut(200, function() { $(this).remove(); });
        });

        $('#btn-guardar-opcion').click(function() {
            const val = $('#inputNuevaOpcion').val().trim();
            if(val !== "" && selectActual) {
                $(selectActual).append(new Option(val, val));
                $(selectActual).val(val);
                bootstrap.Modal.getInstance('#modalNuevaOpcion').hide();
            }
        });

        // --- CRUD INVITADOS ---
        $('#btn-guardar-invitado').click(function() {
            const nombre = $('#inv-nombre').val();
            const menu = $('#inv-menu').val();
            const mesa = $('#inv-mesa').val();

            if(!nombre) return alert("El nombre es obligatorio");

            if(filaEditando) {
                $(filaEditando).find('.td-nombre').text(nombre);
                $(filaEditando).find('.td-menu').text(menu);
                $(filaEditando).find('.td-mesa').text(mesa);
                $(`.guest-item[data-id="${$(filaEditando).data('id')}"]`).text(nombre);
                filaEditando = null;
            } else {
                const guestId = 'guest-' + Date.now();
                const tr = `
                    <tr class="fila-invitado" data-id="${guestId}">
                        <td class="td-nombre">${nombre}</td>
                        <td><span class="badge bg-light text-dark border">Manual</span></td>
                        <td class="td-menu">${menu}</td>
                        <td class="text-center fw-bold text-muted td-mesa">${mesa}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="abrirModalInvitado('editar', this)"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarFila(this)"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>`;
                $('#tabla-invitados-body').append(tr);
                $('#lista-invitados-sin-asignar').append(`<div class="guest-item shadow-sm" data-id="${guestId}">${nombre}</div>`);
            }
            bootstrap.Modal.getInstance('#modalInvitado').hide();
            actualizarAnalitica();
        });

        // --- ACOMODO DE MESAS ---
        function aplicarZoom() {
            $('#workspace-mesas').css('transform', `scale(${zoomLevel})`);
        }

        $('#btn-zoom-in').click(function() { zoomLevel += 0.1; aplicarZoom(); });
        $('#btn-zoom-out').click(function() { if(zoomLevel > 0.3) zoomLevel -= 0.1; aplicarZoom(); });
        $('#btn-zoom-reset').click(function() { zoomLevel = 1.0; aplicarZoom(); });

        $('#btn-crear-mesa').click(function() {
            contadorMesas++;
            const capacidad = $('#input-capacidad-mesa').val() || 8;
            
            const mesaHtml = `
                <div class="mesa-card draggable-mesa shadow" id="mesa-${contadorMesas}" data-capacidad="${capacidad}" style="top: 100px; left: 100px;">
                    <div class="mesa-header">Mesa ${contadorMesas}</div>
                    <div class="mesa-body">
                        <p class="text-muted small text-center m-0 empty-text">(Sin invitados)</p>
                    </div>
                    <div class="mesa-footer">
                        <span class="count">0</span> / ${capacidad} personas
                    </div>
                </div>
            `;
            
            $('#workspace-mesas').append(mesaHtml);
            $('.draggable-mesa').draggable({ containment: "#workspace-mesas", scroll: false });
            actualizarAnalitica();
        });

        $(document).on('click', '.guest-item', function(e) {
            e.stopPropagation();
            $('.guest-item').removeClass('selected');
            $(this).addClass('selected');
        });

        $(document).on('click', '.mesa-card', function(e) {
            $('.mesa-card').removeClass('selected');
            $(this).addClass('selected');
        });

        $('#workspace-mesas').click(function(e) {
            if(e.target.id === 'workspace-mesas') {
                $('.mesa-card').removeClass('selected');
                $('.guest-item').removeClass('selected');
            }
        });

        $('#btn-asignar-invitado').click(function() {
            const invSelected = $('#lista-invitados-sin-asignar .guest-item.selected');
            const mesaSel = $('.mesa-card.selected');

            if(invSelected.length === 0) return alert("Selecciona un invitado lateral.");
            if(mesaSel.length === 0) return alert("Selecciona una mesa en el plano.");

            const max = parseInt(mesaSel.data('capacidad'));
            const actuales = mesaSel.find('.guest-item').length;
            if(actuales >= max) return alert("Mesa llena.");

            mesaSel.find('.empty-text').hide();
            invSelected.removeClass('selected').appendTo(mesaSel.find('.mesa-body'));
            actualizarContadorMesa(mesaSel);
            
            const gId = invSelected.data('id');
            const numMesa = mesaSel.find('.mesa-header').text().replace('Mesa ', '');
            $(`tr[data-id="${gId}"] .td-mesa`).text(numMesa).removeClass('text-muted');
            actualizarAnalitica();
        });

        $('#btn-quitar-invitado').click(function() {
            const invEnMesa = $('.mesa-card .guest-item.selected');
            if(invEnMesa.length === 0) return alert("Selecciona un invitado dentro de una mesa.");

            const mesaOrigen = invEnMesa.closest('.mesa-card');
            invEnMesa.removeClass('selected').appendTo('#lista-invitados-sin-asignar');

            if(mesaOrigen.find('.guest-item').length === 0) mesaOrigen.find('.empty-text').show();
            actualizarContadorMesa(mesaOrigen);
            
            const gId = invEnMesa.data('id');
            $(`tr[data-id="${gId}"] .td-mesa`).text('S/A').addClass('text-muted');
            actualizarAnalitica();
        });

        $('#btn-eliminar-mesa-seleccionada').click(function() {
            const mesaSel = $('.mesa-card.selected');
            if(mesaSel.length === 0) return alert("Selecciona mesa a eliminar.");

            if(confirm("¿Eliminar esta mesa?")) {
                mesaSel.find('.guest-item').each(function() {
                    const gId = $(this).data('id');
                    $(`tr[data-id="${gId}"] .td-mesa`).text('S/A').addClass('text-muted');
                });
                mesaSel.find('.guest-item').appendTo('#lista-invitados-sin-asignar');
                mesaSel.remove();
                actualizarAnalitica();
            }
        });

        function actualizarContadorMesa(mesa) {
            mesa.find('.count').text(mesa.find('.guest-item').length);
        }

        $('#btn-exportar-mapa').click(function() {
            alert("¡El mapa de mesas se ha exportado correctamente como imagen (PNG)!");
        });

        // --- ANALÍTICA ---
        $(document).on('shown.bs.tab', 'button[data-bs-target="#tab-reportes"]', function() {
            actualizarAnalitica();
        });

        // Cargar invitados simulados al iniciar para ver las gráficas vivas
        $('.fila-invitado').each(function() {
            let nombre = $(this).find('.td-nombre').text();
            let gId = $(this).data('id');
            $('#lista-invitados-sin-asignar').append(`<div class="guest-item shadow-sm" data-id="${gId}">${nombre}</div>`);
        });
        actualizarAnalitica();
    }

    // ==========================================
    // 3. LÓGICA PARA: invitado.html
    // ==========================================
    if ($('#vista-invitacion').length > 0) {
        
        $('#btn-abrir-registro').click(function() {
            $('#vista-invitacion').addClass('hidden');
            $('#vista-formulario').removeClass('hidden');
        });

        $('#btn-cancelar-registro').click(function() {
            $('#vista-formulario').addClass('hidden');
            $('#vista-invitacion').removeClass('hidden');
        });

        let contadorAcompanantes = 0;
        $('#btn-agregar-acompanante').click(function() {
            contadorAcompanantes++;
            
            let menuOptions = '<option value="">Elige una opción...</option>';
            menuOptions += `<option value="Res">Res</option>`;
            menuOptions += `<option value="Pollo">Pollo</option>`;
            menuOptions += `<option value="Opción Vegana">Opción Vegana</option>`;

            let html = `
                <div class="card p-3 mb-3 acompanante-item border border-warning bg-white shadow-sm" style="border-radius: 12px;">
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <label class="form-label m-0 fw-bold text-dark">Acompañante ${contadorAcompanantes}</label>
                        <button type="button" class="btn btn-sm text-danger btn-eliminar-acompanante"><i class="bi bi-trash3"></i> Quitar</button>
                    </div>
                    <div class="row g-3">
                        <div class="col-md-7">
                            <label class="form-label small text-secondary">Nombre Completo</label>
                            <input type="text" class="form-control" placeholder="Ej. Ana Rodríguez" required>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label small text-secondary">Su Menú</label>
                            <select class="form-select" required>
                                ${menuOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
            $('#acompanantes-container').append(html);
        });

        $(document).on('click', '.btn-eliminar-acompanante', function() {
            $(this).closest('.acompanante-item').slideUp(200, function() { $(this).remove(); });
        });
        
        $('#registro-invitados').submit(function(e) {
            e.preventDefault();
            alert('¡Confirmación enviada! Tus datos y los de tus acompañantes han sido registrados.');
            $('#vista-formulario').addClass('hidden');
            $('#vista-invitacion').removeClass('hidden');
            this.reset();
            $('#acompanantes-container').empty();
            contadorAcompanantes = 0;
        });
    }

});

// ==========================================
// FUNCIONES GLOBALES REUTILIZABLES
// ==========================================

// Truco Frontend: Guarda el nombre temporalmente y redirige a gestion.html
function abrirDetallesEvento(nombre, fecha, lugar, cardId) {
    localStorage.setItem('eventoMockNombre', nombre);
    window.location.href = 'gestion.html';
}

function abrirModalOpcion(selectId, titulo) {
    selectActual = selectId;
    $('#tituloModalOpcion').text(`Nueva ${titulo}`);
    $('#inputNuevaOpcion').val('');
    new bootstrap.Modal('#modalNuevaOpcion').show();
}

function eliminarOpcionSelect(selectId) {
    const val = $(selectId).val();
    if(val) $(`${selectId} option[value='${val}']`).remove();
}

function abrirModalInvitado(modo, btn = null) {
    $('#inv-menu').empty();
    let hayMenus = false;
    $('.menu-name-span').each(function() {
        const menuText = $(this).text();
        $('#inv-menu').append(new Option(menuText, menuText));
        hayMenus = true;
    });
    if(!hayMenus) $('#inv-menu').append(new Option("Sin menú configurado", "N/A"));

    $('#inv-mesa').empty();
    $('#inv-mesa').append(new Option("Sin asignar", "S/A"));
    for(let i=1; i<=20; i++) {
        $('#inv-mesa').append(new Option(`Mesa ${i}`, i));
    }

    if(modo === 'nuevo') {
        filaEditando = null;
        $('#tituloModalInvitado').text("Agregar Invitado");
        $('#inv-nombre').val('');
        $('#inv-mesa').val('S/A');
    } else {
        filaEditando = $(btn).closest('tr');
        $('#tituloModalInvitado').text("Editar Invitado");
        $('#inv-nombre').val($(filaEditando).find('.td-nombre').text());
        $('#inv-menu').val($(filaEditando).find('.td-menu').text());
        $('#inv-mesa').val($(filaEditando).find('.td-mesa').text());
    }
    new bootstrap.Modal('#modalInvitado').show();
}

function eliminarFila(btn) {
    if(confirm("¿Eliminar este invitado?")) {
        const gId = $(btn).closest('tr').data('id');
        $(`.guest-item[data-id="${gId}"]`).remove();
        $(btn).closest('tr').fadeOut(200, function() { 
            $(this).remove(); 
            actualizarAnalitica();
        });
    }
}

// Función extraída globalmente para que las demás la puedan llamar
function actualizarAnalitica() {
    if ($('#rep-total-platos').length === 0) return; // Salir si no existe el DOM

    const totalPlatos = $('.fila-invitado').length;
    $('#rep-total-platos').text(totalPlatos);
    
    let sillasTotales = 0;
    $('.mesa-card').each(function() { sillasTotales += parseInt($(this).data('capacidad')); });
    const sillasOcupadas = $('.mesa-card .guest-item').length;
    $('#rep-mesas-info').text(`${sillasOcupadas} / ${sillasTotales}`);
    
    $('#rep-mesas-creadas').text($('.mesa-card').length);

    let invitadosSinAsignar = $('#lista-invitados-sin-asignar .guest-item').length;
    let porcentaje = totalPlatos > 0 ? Math.round((sillasOcupadas / totalPlatos) * 100) : 0;
    $('#rep-porcentaje-acomodo').text(`${porcentaje}%`);
    $('#rep-progress-bar').css('width', `${porcentaje}%`);
    $('#rep-sin-asignar-texto').text(`${invitadosSinAsignar} invitados flotantes (sin mesa)`);

    let conteoMenus = {};
    $('.fila-invitado').each(function() {
        let menu = $(this).find('.td-menu').text().trim();
        if(menu === "N/A" || menu === "") menu = "Sin definir";
        if(!conteoMenus[menu]) conteoMenus[menu] = 0;
        conteoMenus[menu]++;
    });

    $('#rep-lista-desglose').empty();
    let labels = [];
    let data = [];
    let colores = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6']; 

    let colorIndex = 0;
    for (let menu in conteoMenus) {
        labels.push(menu);
        data.push(conteoMenus[menu]);
        $('#rep-lista-desglose').append(`
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-0">
                <span class="small fw-medium text-secondary">${menu}</span>
                <span class="badge rounded-pill" style="background-color: ${colores[colorIndex % colores.length]}">${conteoMenus[menu]}</span>
            </li>
        `);
        colorIndex++;
    }

    if(Object.keys(conteoMenus).length === 0) {
        $('#rep-lista-desglose').append('<li class="list-group-item px-0 border-0 text-muted small">Sin datos</li>');
    }

    if (menuChartInstance) { menuChartInstance.destroy(); }
    
    const ctx = document.getElementById('menuChart');
    if(ctx && labels.length > 0) {
        menuChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colores,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
                cutout: '75%'
            }
        });
    }


}
function cargarEventos() {
    $.ajax({
        url: 'php/obtener_eventos.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                $('#contenedor-eventos').empty();
                
                response.data.forEach(function(evento) {
                    
                    //Lógica para saber si está activo o inactivo
                    let today = new Date().toISOString().split('T')[0];
                    let statusBadge = (evento.fecha < today) ? 
                        '<span class="badge bg-secondary mb-2">Inactivo (Finalizado)</span>' : 
                        '<span class="badge bg-success mb-2">Activo</span>';
                    let extraClass = (evento.fecha < today) ? 'inactivo' : '';

                    let cardHtml = `
                        <div class="col-md-4 mb-4">
                            <div class="card event-card shadow-sm border-0 h-100 p-4 ${extraClass}" style="cursor: pointer;" onclick="window.location.href='gestion.html?id=${evento.id}'">
                                <div class="text-start">
                                    ${statusBadge}
                                </div>
                                <div class="d-flex align-items-center mb-3 mt-1">
                                    <div class="bg-primary-custom rounded-circle p-2 me-3 text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        <i class="bi bi-calendar-event"></i>
                                    </div>
                                    <h6 class="mb-0 fw-bold text-dark text-capitalize">${evento.nombre}</h6>
                                </div>
                                <div class="small text-secondary mt-auto">
                                    <p class="mb-1"><i class="bi bi-geo-alt me-1"></i> ${evento.lugar}</p>
                                    <p class="mb-0"><i class="bi bi-calendar me-1"></i> ${evento.fecha}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    $('#contenedor-eventos').append(cardHtml);
                });
            }
        }
    });
}
// Ejecutar la función en cuanto se abra el dashboard
$(document).ready(function() {
    cargarEventos();
});