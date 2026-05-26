// ==========================================
// VARIABLES GLOBALES
// ==========================================
let selectActual = null;
let filaEditando = null;
let zoomLevel = 1.0;
let menuChartInstance = null;
let invitadoEditandoId = null;

// ==========================================
// FUNCIONES GLOBALES REUTILIZABLES (Backend)
// ==========================================

function cargarEventos() {
    $.ajax({
        url: 'php/obtener_eventos.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                $('#contenedor-eventos').empty();
                
                response.data.forEach(function(evento) {
                    let today = new Date().toISOString().split('T')[0];
                    let statusBadge = (evento.fecha < today) ? 
                        '<span class="badge bg-secondary mb-2 border">Inactivo (Finalizado)</span>' : 
                        '<span class="badge bg-success mb-2">Activo</span>';
                    let extraClass = (evento.fecha < today) ? 'inactivo' : '';

                    let cardHtml = `
                        <div class="col-md-4 mb-4">
                            <div class="card event-card shadow-sm border-0 h-100 p-4 ${extraClass}" style="cursor: pointer;" onclick="window.location.href='gestion.html?id_evento=${evento.id_evento}'">
                                <div class="text-start">${statusBadge}</div>
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

function cargarDetalleEvento(id) {
    $.ajax({
        url: 'php/obtener_detalle_evento.php',
        method: 'GET',
        data: { id: id },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                const evento = response.data.evento;
                const tipos = response.data.tipos_evento;
                const vestimentas = response.data.tipos_vestimenta;
                const menus = response.data.menus;
                
                $('#titulo-evento, #display-event-name').text(evento.nombre);
                $('#edit-nombre').val(evento.nombre);
                $('#edit-lugar').val(evento.lugar);
                $('#edit-fecha').val(evento.fecha);
                $('#edit-hora').val(evento.hora);
                $('#inv-titulo-form').val(evento.titulo_invitacion || '');
                $('#inv-mensaje-form').val(evento.mensaje_invitacion || '');
                
                let selectTipo = $('#edit-tipo');
                selectTipo.empty();
                tipos.forEach(t => { selectTipo.append(new Option(t.nombre_tipo, t.id_tipo_evento)); });
                if(evento.id_tipo_evento) selectTipo.val(evento.id_tipo_evento);

                let selectVestimenta = $('#edit-vestimenta');
                selectVestimenta.empty();
                vestimentas.forEach(v => { selectVestimenta.append(new Option(v.nombre_vestimenta, v.id_tipo_vestimenta)); });
                if(evento.id_tipo_vestimenta) selectVestimenta.val(evento.id_tipo_vestimenta);

                $('#menu-cards-container').empty(); 
                menus.forEach(m => {
                    const cardHtml = `
                        <div class="col-md-4 menu-card-item" data-id="${m.id_menu}">
                            <div class="card border-0 shadow-sm h-100" style="background-color: #fdf2f8;">
                                <div class="card-body d-flex justify-content-between align-items-center p-3">
                                    <div><i class="bi bi-cup-hot text-primary-custom me-2"></i><span class="fw-medium text-dark menu-name-span">${m.nombre_platillo}</span></div>
                                    <button class="btn btn-sm btn-outline-danger border-0 remove-menu-card" data-id="${m.id_menu}"><i class="bi bi-trash3"></i></button>
                                </div>
                            </div>
                        </div>`;
                    $('#menu-cards-container').append(cardHtml);
                });

                let selectMenuModal = $('#inv-menu');
                selectMenuModal.empty().append('<option value="">Sin menú (Por definir)</option>');
                menus.forEach(m => {
                    selectMenuModal.append(new Option(m.nombre_platillo, m.id_menu));
                });

            } else {
                Swal.fire({
                    title: 'Error',
                    text: "No se pudo cargar el evento: " + response.message,
                    icon: 'error',
                    confirmButtonText: 'ACEPTAR',
                    customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                    buttonsStyling: false
                }).then(() => { window.location.href = 'dashboard.html'; });
            }
        }
    });
}

function cargarMesas() {
    const id_evento = new URLSearchParams(window.location.search).get('id_evento');
    
    $.ajax({
        url: 'php/obtener_mesas.php',
        method: 'GET',
        data: { id_evento: id_evento },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                $('#workspace-mesas').empty(); 
                
                response.data.forEach(mesa => {
                    dibujarMesaInteractiva(mesa.id_mesa, mesa.numero_mesa, mesa.capacidad_maxima, 100, 100);
                });
                
                if (typeof actualizarAnalitica === "function") {
                    actualizarAnalitica();
                }

                // Cargamos invitados DESPUÉS de dibujar las mesas
                cargarInvitados(); 

            } else {
                console.error("Error al cargar mesas:", response.message);
            }
        }
    });
}

function cargarInvitados() {
    const id_evento = new URLSearchParams(window.location.search).get('id_evento');
    
    $.ajax({
        url: 'php/obtener_invitados.php',
        method: 'GET',
        data: { id_evento: id_evento },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                const tbody = $('#tabla-invitados-body');
                const panelSinAsignar = $('#lista-invitados-sin-asignar');
                
                tbody.empty(); 
                panelSinAsignar.empty();
                $('.mesa-body').html('<p class="text-muted small text-center m-0 empty-text">(Sin invitados)</p>');
                $('.count').text('0');

                if(response.data.length === 0) {
                    tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">Aún no hay invitados registrados.</td></tr>');
                    return;
                }

                response.data.forEach(invitado => {
                    const menuText = invitado.nombre_platillo ? invitado.nombre_platillo : '<span class="text-muted">Por definir</span>';
                    let numMesaText = invitado.nombre_mesa ? invitado.nombre_mesa : 'S/A';
                    
                    // si es acompañante, mostramos de quién es, si no es principal.
                    let tipoBadge = '';
                    if (invitado.id_invitado_principal) {
                        const titular = invitado.nombre_titular ? invitado.nombre_titular : 'Desconocido';
                        tipoBadge = `
                            <span class="badge border text-secondary text-start" style="background-color: #f8f9fa;">
                                Acompañante de:<br><small class="fw-bold text-dark">${titular}</small>
                            </span>`;
                    } else {
                        tipoBadge = '<span class="badge text-white shadow-sm" style="background-color: #f472b6;">Principal</span>';
                    }
                    
                    const filaHtml = `
                        <tr class="fila-invitado" data-id="${invitado.id_invitado}">
                            <td class="td-nombre fw-medium">${invitado.nombre_completo}</td>
                            <td>${tipoBadge}</td>
                            <td class="td-menu">${menuText}</td>
                            <td class="text-center fw-bold text-muted td-mesa">${numMesaText}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger btn-eliminar-invitado" data-id="${invitado.id_invitado}"><i class="bi bi-trash3"></i></button>
                            </td>
                        </tr>
                    `;
                    tbody.append(filaHtml);

                    const guestCard = `<div class="guest-item shadow-sm" data-id="${invitado.id_invitado}">${invitado.nombre_completo}</div>`;
                    
                    if (invitado.id_mesa) {
                        const contenedorMesa = $(`#mesa-db-${invitado.id_mesa}`);
                        if (contenedorMesa.length) {
                            contenedorMesa.find('.empty-text').hide();
                            contenedorMesa.find('.mesa-body').append(guestCard);
                            contenedorMesa.find('.count').text(contenedorMesa.find('.guest-item').length);
                        } else {
                            panelSinAsignar.append(guestCard);
                        }
                    } else {
                        panelSinAsignar.append(guestCard);
                    }
                });
                
                if (typeof actualizarAnalitica === "function") { actualizarAnalitica(); }
            }
        }
    });
}

function dibujarMesaInteractiva(id_mesa, numero, capacidad, posX, posY) {
    const posicionGuardada = localStorage.getItem('mesa_pos_evento_' + id_mesa);
    if (posicionGuardada) {
        const coords = JSON.parse(posicionGuardada);
        posX = coords.x;
        posY = coords.y;
    }

    const mesaHtml = `
        <div class="mesa-card draggable-mesa shadow" id="mesa-db-${id_mesa}" data-id-mesa="${id_mesa}" data-capacidad="${capacidad}" style="position: absolute; top: ${posY}px; left: ${posX}px; width: 180px;">
            <div class="mesa-header fw-bold text-center text-white py-1" style="background-color: #f472b6; border-radius: 6px 6px 0 0;">Mesa ${numero}</div>
            <div class="mesa-body p-2" style="max-height: 140px; overflow-y: auto; overflow-x: hidden; background-color: white;">
                <p class="text-muted small text-center m-0 empty-text">(Sin invitados)</p>
            </div>
            <div class="mesa-footer text-center small py-1" style="background-color: #fdf2f8; border-radius: 0 0 6px 6px; color: #ec4899; font-weight: 500;">
                <span class="count">0</span> / ${capacidad} personas
            </div>
        </div>
    `;
    
    const $mesa = $(mesaHtml);
    $('#workspace-mesas').append($mesa);

    $mesa.draggable({ 
        containment: "#workspace-mesas", 
        scroll: false,
        stop: function(event, ui) {
            const coords = { x: ui.position.left, y: ui.position.top };
            localStorage.setItem('mesa_pos_evento_' + id_mesa, JSON.stringify(coords));
        }
    });
}

// ==========================================
// FUNCIONES GLOBALES REUTILIZABLES (Frontend UI)
// ==========================================
function abrirModalInvitado(modo, btn = null) {
    $('#inv-mesa').empty();
    $('#inv-mesa').append(new Option("Sin asignar (Flotante)", "S/A"));
    
    $('.mesa-card').each(function() {
        const idMesa = $(this).data('id-mesa'); // El ID real de la BD
        const numMesa = $(this).find('.mesa-header').text(); // Ejemplo: "Mesa 1"
        $('#inv-mesa').append(new Option(numMesa, idMesa));
    });

    if(modo === 'nuevo') {
        invitadoEditandoId = null;
        $('#tituloModalInvitado').text("Agregar Invitado");
        $('#inv-nombre').val('');
        $('#inv-menu').val('');
        $('#inv-mesa').val('S/A');
    } 
    new bootstrap.Modal('#modalInvitado').show();
}

function abrirModalOpcion(selector, titulo) {
    selectActual = selector; 
    $('#tituloModalOpcion').text('Añadir ' + titulo);
    $('#inputNuevaOpcion').val('');
    new bootstrap.Modal(document.getElementById('modalNuevaOpcion')).show();
}

function eliminarOpcionSelect(selectId) {
    console.log("Clic detectado. Intentando eliminar en:", selectId);

    const val = $(selectId).val();
    
    //Si el select está vacío avisamos
    if(!val) {
        Swal.fire({
            title: 'Atención',
            text: 'No hay ninguna opción seleccionada para eliminar.',
            icon: 'warning',
            confirmButtonText: 'ENTENDIDO',
            customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
            buttonsStyling: false
        });
        return; 
    }

    let tipoCatalogo = (selectId === '#edit-tipo') ? 'tipo_evento' : 'vestimenta';
    console.log("El ID a borrar es:", val, "de la tabla:", tipoCatalogo);

    Swal.fire({
        title: '¿Eliminar opción?',
        text: '¿Seguro que deseas eliminar esta opción de la base de datos?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        reverseButtons: true,
        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar', cancelButton: 'alerta-rosa-btn-cancelar' },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
        $.ajax({
            url: 'php/eliminar_catalogo.php', 
            method: 'POST',
            data: { id: val, tipo_catalogo: tipoCatalogo },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    $(`${selectId} option[value='${val}']`).remove();
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Opción eliminada correctamente.',
                        icon: 'success',
                        confirmButtonText: 'ACEPTAR',
                        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                        buttonsStyling: false
                    });
                } else {
                    Swal.fire({ title: 'Error', text: 'Error en la BD: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function(xhr) {
                Swal.fire({ title: 'Error de servidor', text: 'Error de comunicación con el servidor. Presiona F12 para ver detalles.', icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                console.error("Error del servidor:", xhr.responseText);
            }
        });
        }
    });
}

function actualizarAnalitica() {
    if ($('#rep-total-platos').length === 0) return;

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


// ==========================================
// ARRANQUE PRINCIPAL (Al cargar la página)
// ==========================================
$(document).ready(function() {

    // --- ARRANQUE AUTOMÁTICO DE DATOS ---
    if ($('#contenedor-eventos').length > 0) {
        cargarEventos(); 
    }

    const parametrosURL = new URLSearchParams(window.location.search);
    const idEvento = parametrosURL.get('id_evento'); 
    
    if (idEvento && $('#vista-invitacion').length === 0) {
        cargarDetalleEvento(idEvento); 
        cargarMesas();
        generarQReLink();
    }

    // --- EVENTOS DEL LOGIN ---
    $('#form-login').on('submit', function(e) {
        e.preventDefault(); 
        $('#mensaje-error').text('');
        
        let correo = $('#correo-login').val();
        let password = $('#password-login').val();

        $.ajax({
            url: 'php/login.php',
            method: 'POST',
            data: { correo: correo, password: password },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    window.location.href = 'dashboard.html';
                } else {
                    $('#mensaje-error').text(response.message);
                }
            },
            error: function() { $('#mensaje-error').text("Error de comunicación."); }
        });
    });

    // --- EVENTOS DEL DASHBOARD ---
    $('#btn-crear-evento').click(function() { 
        new bootstrap.Modal('#modalCrearEvento').show(); 
    });

    $('#btn-guardar-evento').click(function() {
        const nombre = $('#nombre-ev').val();
        const fecha = $('#fecha-ev').val();
        const lugar = $('#lugar-ev').val();

        if(!nombre || !fecha || !lugar) {
            Swal.fire({ title: 'Campos incompletos', text: 'Por favor completa todos los campos.', icon: 'warning', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }
        
        $.ajax({
            url: 'php/crear_evento.php',
            method: 'POST',
            data: { nombre: nombre, fecha: fecha, lugar: lugar },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    Swal.fire({
                        title: '¡Evento creado!',
                        text: response.message,
                        icon: 'success',
                        confirmButtonText: 'ACEPTAR',
                        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                        buttonsStyling: false
                    });
                    const modalElement = document.getElementById('modalCrearEvento');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();

                    $('#nombre-ev').val('');
                    $('#fecha-ev').val('');
                    $('#lugar-ev').val('');
                    cargarEventos();
                } else {
                    Swal.fire({ title: 'Error', text: 'Error al guardar en BD: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function() {
                Swal.fire({ title: 'Error de conexión', text: 'No se pudo conectar con el servidor.', icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            }
        });
    });

    // --- EVENTOS DE GESTIÓN (gestion.html) ---

    // Menús Dinámicos
    $('#btn-guardar-opcion').off('click').on('click', function() {
        const val = $('#inputNuevaOpcion').val().trim();
        if(val !== "" && selectActual) {
            let tipoCatalogo = (selectActual === '#edit-tipo') ? 'tipo_evento' : 'vestimenta';
            $.ajax({
                url: 'php/agregar_catalogo.php',
                method: 'POST',
                data: { tipo_catalogo: tipoCatalogo, nombre: val },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        $(selectActual).append(new Option(response.nombre, response.id));
                        $(selectActual).val(response.id);
                        bootstrap.Modal.getInstance(document.getElementById('modalNuevaOpcion')).hide();
                    } else {
                        Swal.fire({ title: 'Error', text: 'Error al guardar: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                    }
                }
            });
        }
    });

    $('#btn-add-menu-card').off('click').on('click', function() {
        const menuName = $('#input-new-menu').val().trim();
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');

        if(menuName !== "" && id_evento) {
            $.ajax({
                url: 'php/agregar_menu.php',
                method: 'POST',
                data: { id_evento: id_evento, nombre_platillo: menuName },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        const cardHtml = `
                            <div class="col-md-4 menu-card-item" data-id="${response.id_menu}">
                                <div class="card border-0 shadow-sm h-100" style="background-color: #fdf2f8;">
                                    <div class="card-body d-flex justify-content-between align-items-center p-3">
                                        <div><i class="bi bi-cup-hot text-primary-custom me-2"></i><span class="fw-medium text-dark menu-name-span">${response.nombre}</span></div>
                                        <button class="btn btn-sm btn-outline-danger border-0 remove-menu-card" data-id="${response.id_menu}"><i class="bi bi-trash3"></i></button>
                                    </div>
                                </div>
                            </div>`;
                        $('#menu-cards-container').append(cardHtml);
                        $('#input-new-menu').val(''); 
                        $('#inv-menu').append(new Option(response.nombre, response.id_menu));
                    } else {
                        Swal.fire({ title: 'Error', text: 'Error: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                    }
                }
            });
        }
    });

    $(document).on('click', '.remove-menu-card', function() {
    const btn = $(this);
    const idMenu = btn.data('id');

    Swal.fire({
        title: '¿Eliminar platillo?',
        text: '¿Seguro que deseas eliminar este platillo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        reverseButtons: true,
        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar', cancelButton: 'alerta-rosa-btn-cancelar' },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
        $.ajax({
            url: 'php/eliminar_menu.php', 
            method: 'POST',
            data: { id_menu: idMenu },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    btn.closest('.menu-card-item').fadeOut(200, function() { $(this).remove(); });
                } else {
                    Swal.fire({ title: 'Error', text: 'Error al eliminar en la BD: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function() {
                Swal.fire({ title: 'Error de conexión', text: 'Error de comunicación con el servidor.', icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            }
        });
        }
    });
});

    $('#btn-guardar-cambios').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        const data = {
            id_evento: id_evento,
            nombre: $('#edit-nombre').val(),
            id_tipo_evento: $('#edit-tipo').val(),
            lugar: $('#edit-lugar').val(),
            fecha: $('#edit-fecha').val(),
            hora: $('#edit-hora').val(),
            id_tipo_vestimenta: $('#edit-vestimenta').val()
        };

        $.ajax({
            url: 'php/actualizar_evento.php', 
            method: 'POST', 
            data: data, 
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    Swal.fire({
                        title: '¡Guardado!',
                        text: '¡Tus cambios se han guardado!',
                        icon: 'success',
                        confirmButtonText: 'ACEPTAR',
                        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                        buttonsStyling: false
                    });
                    $('#titulo-evento, #display-event-name').text(data.nombre);
                } else { 
                    Swal.fire({ title: 'Error', text: 'Error al guardar: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function(xhr) {
                Swal.fire({ title: 'Error de servidor', text: 'El servidor detuvo el guardado. Error exacto: ' + xhr.responseText, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            }
        });
    });

    $('#btn-eliminar-evento').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        
        Swal.fire({
            title: '¿ELIMINAR EVENTO?',
            text: '¡Esta acción borrará de forma permanente todo el evento y sus invitados! ¿Deseas proceder?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            reverseButtons: true,
            customClass: {
                popup: 'alerta-rosa-popup',
                title: 'alerta-rosa-titulo',
                htmlContainer: 'alerta-rosa-texto',
                icon: 'alerta-rosa-icono',
                confirmButton: 'alerta-rosa-btn-confirmar',
                cancelButton: 'alerta-rosa-btn-cancelar'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'php/eliminar_evento.php', method: 'POST', data: { id_evento: id_evento }, dataType: 'json',
                    success: function(response) {
                        if(response.status === 'success') {
                            window.location.href = 'dashboard.html';
                        } else { 
                            Swal.fire({ title: 'Error', text: response.message, icon: 'error' }); 
                        }
                    }
                });
            }
        });
    });

    // ABRIR MODAL PARA EDITAR INVITADO
    $(document).on('click', '.btn-editar-invitado', function() {
        invitadoEditandoId = $(this).data('id');
        const nombreActual = $(this).data('nombre');
        const menuActual = $(this).data('menu');

        $('#tituloModalInvitado').text("Editar Invitado");
        $('#inv-nombre').val(nombreActual);
        $('#inv-menu').val(menuActual);
        
        $('#inv-mesa').closest('.col-md-12').hide(); 

        new bootstrap.Modal('#modalInvitado').show();
    });

    // Acomodo de Mesas y Zoom
    function aplicarZoom() { $('#workspace-mesas').css('transform', `scale(${zoomLevel})`); }
    $('#btn-zoom-in').click(function() { zoomLevel += 0.1; aplicarZoom(); });
    $('#btn-zoom-out').click(function() { if(zoomLevel > 0.3) zoomLevel -= 0.1; aplicarZoom(); });
    $('#btn-zoom-reset').click(function() { zoomLevel = 1.0; aplicarZoom(); });

    $('#btn-crear-mesa').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        const capacidad = $('#input-capacidad-mesa').val() || 8;

        $.ajax({
            url: 'php/agregar_mesa.php',
            method: 'POST',
            data: { id_evento: id_evento, capacidad: capacidad },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    dibujarMesaInteractiva(response.id_mesa, response.numero_mesa, capacidad, 100, 100);
                    actualizarAnalitica();
                } else {
                    Swal.fire({ title: 'Error', text: 'Error: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function(xhr) {
                Swal.fire({ title: 'Error de servidor', text: 'Error del servidor: ' + xhr.responseText, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            }
        });
    });

    // Eventos visuales para seleccionar invitados y mesas
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

    // ASIGNAR y QUITAR con AJAX a la BD
    $('#btn-asignar-invitado').off('click').on('click', function() {
        const invSelected = $('#lista-invitados-sin-asignar .guest-item.selected');
        const mesaSel = $('.mesa-card.selected');

        if(invSelected.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Selecciona un invitado de la lista lateral.', icon: 'info', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }
        if(mesaSel.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Selecciona una mesa en el plano.', icon: 'info', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }

        const idInvitado = invSelected.data('id');
        const idMesa = mesaSel.data('id-mesa'); 

        const max = parseInt(mesaSel.data('capacidad'));
        const actuales = mesaSel.find('.guest-item').length;
        if(actuales >= max) {
            Swal.fire({ title: 'Mesa llena', text: 'Esta mesa ya alcanzó su capacidad máxima.', icon: 'warning', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }

        $.ajax({
            url: 'php/actualizar_mesa_invitado.php',
            method: 'POST',
            data: { id_invitado: idInvitado, id_mesa: idMesa },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    mesaSel.find('.empty-text').hide();
                    invSelected.removeClass('selected').appendTo(mesaSel.find('.mesa-body'));
                    mesaSel.find('.count').text(mesaSel.find('.guest-item').length);
                    const textoMesa = mesaSel.find('.mesa-header').text();
                    $(`tr[data-id="${idInvitado}"] .td-mesa`).text(textoMesa);
                    actualizarAnalitica();
                } else {
                    Swal.fire({ title: 'Error', text: 'Error al asignar: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            }
        });
    });

    $('#btn-quitar-invitado').off('click').on('click', function() {
        const invEnMesa = $('.mesa-card .guest-item.selected');
        if(invEnMesa.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Selecciona un invitado dentro de una mesa.', icon: 'info', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }

        const idInvitado = invEnMesa.data('id');
        const mesaOrigen = invEnMesa.closest('.mesa-card');

        $.ajax({
            url: 'php/actualizar_mesa_invitado.php',
            method: 'POST',
            data: { id_invitado: idInvitado, id_mesa: '' },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    invEnMesa.removeClass('selected').appendTo('#lista-invitados-sin-asignar');
                    if(mesaOrigen.find('.guest-item').length === 0) mesaOrigen.find('.empty-text').show();
                    mesaOrigen.find('.count').text(mesaOrigen.find('.guest-item').length);
                    $(`tr[data-id="${idInvitado}"] .td-mesa`).text('S/A');
                    actualizarAnalitica();
                } else {
                    Swal.fire({ title: 'Error', text: 'Error al quitar asignación: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            }
        });
    });

    $('#btn-eliminar-mesa-seleccionada').off('click').on('click', function() {
        const mesaSel = $('.mesa-card.selected');
        if(mesaSel.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Selecciona una mesa en el plano para poder eliminarla.', icon: 'info' });
            return;
        }

        const idMesa = mesaSel.data('id-mesa');

        Swal.fire({
            title: '¿ELIMINAR MESA?',
            text: '¿Estás seguro de eliminar esta mesa? Los invitados asignados regresarán a la lista de "Sin asignar".',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            reverseButtons: true,
            customClass: {
                popup: 'alerta-rosa-popup',
                title: 'alerta-rosa-titulo',
                htmlContainer: 'alerta-rosa-texto',
                icon: 'alerta-rosa-icono',
                confirmButton: 'alerta-rosa-btn-confirmar',
                cancelButton: 'alerta-rosa-btn-cancelar'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'php/eliminar_mesa.php',
                    method: 'POST',
                    data: { id_mesa: idMesa },
                    dataType: 'json',
                    success: function(response) {
                        if(response.status === 'success') {
                            mesaSel.find('.guest-item').each(function() {
                                const gId = $(this).data('id');
                                $(`tr[data-id="${gId}"] .td-mesa`).text('S/A').addClass('text-muted');
                            });
                            mesaSel.find('.guest-item').appendTo('#lista-invitados-sin-asignar');
                            mesaSel.remove();
                            localStorage.removeItem('mesa_pos_evento_' + idMesa);
                            actualizarAnalitica();
                        } else {
                            Swal.fire({ title: 'Error', text: response.message, icon: 'error' });
                        }
                    }
                });
            }
        });
    });

    $('#btn-exportar-mapa').off('click').on('click', function() {
        const btn = $(this);
        const originalText = btn.html();

        if (typeof html2canvas === 'undefined') {
            Swal.fire({ title: 'Error', text: 'La librería html2canvas no cargó. Verifica que pusiste el <script> en tu gestion.html.', icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }
        
        btn.html('<i class="bi bi-hourglass-split me-1"></i> Generando foto...');
        btn.prop('disabled', true);
        $('.mesa-card').removeClass('selected');

        const zoomAnterior = zoomLevel;
        $('#workspace-mesas').css('transform', 'none');

        //Tomamos la foto
        html2canvas(document.getElementById("workspace-mesas"), {
            backgroundColor: "#fffafb",
            scale: 2
        }).then(canvas => {
            let enlace = document.createElement('a');
            enlace.download = 'Plano_Mesas_EventMaster.png';
            enlace.href = canvas.toDataURL("image/png");
            enlace.click();
            
            //Restauramos el boton y el zoom a como estaban
            btn.html(originalText);
            btn.prop('disabled', false);
            $('#workspace-mesas').css('transform', `scale(${zoomAnterior})`);
            
        }).catch(err => {
            Swal.fire({ title: 'Error al exportar', text: 'Hubo un problema al generar la imagen. Presiona F12 para ver la consola.', icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            console.error("Error de html2canvas:", err);
            
            btn.html(originalText);
            btn.prop('disabled', false);
            $('#workspace-mesas').css('transform', `scale(${zoomAnterior})`);
        });
    });

    $(document).on('shown.bs.tab', 'button[data-bs-target="#tab-reportes"]', function() {
        actualizarAnalitica();
    });

    $(document).on('click', '.btn-eliminar-invitado', function() {
        const idInvitado = $(this).data('id');
        
        Swal.fire({
            title: '¿ELIMINAR INVITADO?',
            text: '¿Estás seguro de que deseas eliminar a este invitado del evento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            reverseButtons: true,
            customClass: {
                popup: 'alerta-rosa-popup',
                title: 'alerta-rosa-titulo',
                htmlContainer: 'alerta-rosa-texto',
                icon: 'alerta-rosa-icono',
                confirmButton: 'alerta-rosa-btn-confirmar',
                cancelButton: 'alerta-rosa-btn-cancelar'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'php/eliminar_invitado.php',
                    method: 'POST',
                    data: { id_invitado: idInvitado },
                    dataType: 'json',
                    success: function(response) {
                        if(response.status === 'success') {
                            cargarInvitados(); 
                        } else {
                            Swal.fire({ title: 'Error', text: response.message, icon: 'error' });
                        }
                    }
                });
            }
        });
    });

    $('#btn-exportar-excel').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        if (id_evento) {
            window.location.href = 'php/exportar_excel.php?id_evento=' + id_evento;
        }
    });

    // Guardar nuevo invitado desde el Modal
    $('#btn-guardar-invitado').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        const nombre = $('#inv-nombre').val().trim();
        const id_menu = $('#inv-menu').val();
        const id_mesa = $('#inv-mesa').val(); 

        if(nombre === "") {
            Swal.fire({ title: 'Campo requerido', text: 'El nombre del invitado no puede estar vacío.', icon: 'warning', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }


        if (id_mesa !== 'S/A') {
            const mesaSeleccionada = $(`#mesa-db-${id_mesa}`);
            if (mesaSeleccionada.length > 0) {
                const maximo = parseInt(mesaSeleccionada.data('capacidad'));
                const actuales = mesaSeleccionada.find('.guest-item').length;
                
                if (actuales >= maximo) {
                    Swal.fire({
                        title: 'MESA LLENA',
                        text: `La Mesa ${mesaSeleccionada.find('.mesa-header').text().replace('Mesa ', '')} ya alcanzó su capacidad máxima (${maximo}/${maximo}).`,
                        icon: 'warning',
                        confirmButtonText: 'ENTENDIDO',
                        customClass: {
                            popup: 'alerta-rosa-popup',
                            title: 'alerta-rosa-titulo',
                            htmlContainer: 'alerta-rosa-texto',
                            icon: 'alerta-rosa-icono',
                            confirmButton: 'alerta-rosa-btn-confirmar'
                        },
                        buttonsStyling: false
                    });
                    return; 
                }
            }
        }

        $.ajax({
            url: 'php/agregar_invitado.php',
            method: 'POST',
            data: { 
                id_evento: id_evento, 
                nombre_completo: nombre, 
                id_menu: id_menu, 
                id_mesa: id_mesa 
            },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    bootstrap.Modal.getInstance(document.getElementById('modalInvitado')).hide();
                    $('#inv-nombre').val('');
                    $('#inv-menu').val('');
                    $('#inv-mesa').val('S/A');
                    
                    cargarInvitados(); 
                } else {
                    Swal.fire({ title: 'Error', text: 'Error al guardar: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            error: function(xhr) {
                Swal.fire({ title: 'Error crítico', text: 'Error crítico del servidor: ' + xhr.responseText, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            }
        });
    });

    // EXPORTAR REPORTE A PDF
    $('#btn-descargar-pdf').off('click').on('click', function() {
        const btn = $(this);
        const originalText = btn.html();
        
        btn.html('<i class="bi bi-hourglass-split me-2"></i>Generando...');
        btn.prop('disabled', true);

        //Seleccionamos toda la pestaña de reportes
        const elemento = document.getElementById('tab-reportes');
        
        //Configuramos el PDF
        const opciones = {
            margin:       10,
            filename:     'Reporte_Logistico_EventMaster.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opciones).from(elemento).save().then(() => {
            btn.html(originalText);
            btn.prop('disabled', false);
        });
    });

    // GUARDAR DISEÑO DE INVITACIÓN
    $('#btn-guardar-invitacion').off('click').on('click', function() {
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        const titulo = $('#inv-titulo-form').val().trim();
        const mensaje = $('#inv-mensaje-form').val().trim();

        if (!titulo || !mensaje) {
            Swal.fire({ title: 'Campos incompletos', text: 'Por favor completa ambos campos para la invitación.', icon: 'warning', confirmButtonText: 'ENTENDIDO', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
            return;
        }

        const btn = $(this);
        const originalText = btn.text();
        btn.text('Guardando...');
        btn.prop('disabled', true);

        $.ajax({
            url: 'php/actualizar_invitacion.php',
            method: 'POST',
            data: { id_evento: id_evento, titulo: titulo, mensaje: mensaje },
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    Swal.fire({
                        title: '¡Actualizado!',
                        text: '¡Diseño actualizado exitosamente!',
                        icon: 'success',
                        confirmButtonText: 'ACEPTAR',
                        customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                        buttonsStyling: false
                    });
                } else {
                    Swal.fire({ title: 'Error', text: 'Error: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                }
            },
            complete: function() {
                btn.text(originalText);
                btn.prop('disabled', false);
            }
        });
    });

    // EVENTOS DE INVITADO (invitado.html)
    if ($('#vista-invitacion').length > 0) {
        
        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        let opcionesMenuHtml = '<option value="">Elige una opción...</option>';

        //Cargar los datos 
        if (id_evento) {
            $.ajax({
                url: 'php/obtener_info_invitacion.php',
                method: 'GET',
                data: { id_evento: id_evento },
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        const ev = response.evento;
                        
                        $('#inv-display-titulo').text(ev.titulo_invitacion || '¡Estás Invitado!');
                        $('#inv-display-mensaje').text(ev.mensaje_invitacion || 'Nos encantaría contar con tu presencia en este día tan especial.');
                        $('#inv-display-evento').text(ev.nombre);
                        $('#inv-display-fecha').text(ev.fecha);
                        $('#inv-display-hora').text(ev.hora);
                        $('#inv-display-lugar').text(ev.lugar);
                        $('#inv-display-vestimenta').text(ev.nombre_vestimenta || 'Por definir');

                        // Generar platillos
                        response.menus.forEach(m => {
                            opcionesMenuHtml += `<option value="${m.id_menu}">${m.nombre_platillo}</option>`;
                        });
                        $('.select-menus-dinamicos').html(opcionesMenuHtml);
                    }
                }
            });
        }

        $('#btn-abrir-registro').click(function() {
            $('#vista-invitacion').addClass('hidden');
            $('#vista-formulario').removeClass('hidden');
        });

        $('#btn-cancelar-registro').click(function() {
            $('#vista-formulario').addClass('hidden');
            $('#vista-invitacion').removeClass('hidden');
        });

        //agregar Acompañantes 
        let contadorAcompanantes = 0;
        $('#btn-agregar-acompanante').click(function() {
            contadorAcompanantes++;
            let html = `
                <div class="card p-3 mb-3 acompanante-item border border-warning bg-white shadow-sm" style="border-radius: 12px;">
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <label class="form-label m-0 fw-bold text-dark">Acompañante ${contadorAcompanantes}</label>
                        <button type="button" class="btn btn-sm text-danger btn-eliminar-acompanante"><i class="bi bi-trash3"></i> Quitar</button>
                    </div>
                    <div class="row g-3">
                        <div class="col-md-7">
                            <label class="form-label small text-secondary">Nombre Completo</label>
                            <input type="text" class="form-control ac-nombre" placeholder="Ej. Ana Rodríguez" required>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label small text-secondary">Su Menú</label>
                            <select class="form-select ac-menu select-menus-dinamicos" required>
                                ${opcionesMenuHtml}
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
        
        //Formulario final
        $('#registro-invitados').submit(function(e) {
            e.preventDefault();
            
            const btn = $('#btn-enviar-registro');
            btn.prop('disabled', true).text('Enviando...');

            // Armar objeto del principal
            const principal = {
                nombre: $('#nombre-principal').val().trim(),
                id_menu: $('#menu-principal').val()
            };

            //Recopilar acompañantes
            let acompanantes = [];
            $('.acompanante-item').each(function() {
                acompanantes.push({
                    nombre: $(this).find('.ac-nombre').val().trim(),
                    id_menu: $(this).find('.ac-menu').val()
                });
            });

            //Enviar por ajax
            $.ajax({
                url: 'php/registrar_asistencia.php',
                method: 'POST',
                data: { 
                    id_evento: id_evento,
                    principal: principal,
                    acompanantes: acompanantes
                },
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            title: '¡Confirmación enviada!',
                            text: 'Tus datos han sido registrados exitosamente.',
                            icon: 'success',
                            confirmButtonText: 'ACEPTAR',
                            customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' },
                            buttonsStyling: false
                        });
                        
                        // Limpiar y regresar
                        $('#registro-invitados')[0].reset();
                        $('#acompanantes-container').empty();
                        contadorAcompanantes = 0;
                        $('#vista-formulario').addClass('hidden');
                        $('#vista-invitacion').removeClass('hidden');
                    } else {
                        Swal.fire({ title: 'Error', text: 'Hubo un error: ' + response.message, icon: 'error', confirmButtonText: 'ACEPTAR', customClass: { popup: 'alerta-rosa-popup', title: 'alerta-rosa-titulo', htmlContainer: 'alerta-rosa-texto', icon: 'alerta-rosa-icono', confirmButton: 'alerta-rosa-btn-confirmar' }, buttonsStyling: false });
                    }
                },
                complete: function() {
                    btn.prop('disabled', false).text('Enviar Confirmación');
                }
            });
        });
    }
    // ==========================================
    // COMPARTIR QR / LINK
    // ==========================================
    
    // Al cargar los datos del evento, generamos la URL y el QR
    function generarQReLink() {
        if ($('#qr-code-container').length === 0) return; // Si no estamos en esa pestaña, no hace nada

        const id_evento = new URLSearchParams(window.location.search).get('id_evento');
        if(!id_evento) return;

        // Construimos la ruta inteligente. Cambia "gestion.html" por "invitado.html"
        // Ejemplo: http://localhost/EventMaster/invitado.html?id_evento=11
        const rutaActual = window.location.href.split('?')[0]; 
        const urlFinal = rutaActual.replace('gestion.html', 'invitado.html') + '?id_evento=' + id_evento;

        // Metemos el link en el input
        $('#input-link-compartir').val(urlFinal);

        // Limpiamos el contenedor por si había un QR viejo
        $('#qr-code-container').empty();

        // Dibujamos el QR nuevo (incluso le puse el color rosa de tu tema)
        new QRCode(document.getElementById("qr-code-container"), {
            text: urlFinal,
            width: 180,
            height: 180,
            colorDark : "#ec4899", // Rosa EventMaster
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    $('#btn-copiar-link').off('click').on('click', function() {
        const linkInput = document.getElementById('input-link-compartir');
        const btn = $(this);
        const originalText = btn.html();

        // Seleccionar y copiar 
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); 
        navigator.clipboard.writeText(linkInput.value).then(function() {
            // Efecto visual chido de confirmación
            btn.html('<i class="bi bi-check2 me-1"></i>¡Copiado!');
            btn.removeClass('btn-primary-custom').addClass('btn-success border-success');
            
            setTimeout(() => {
                btn.html(originalText);
                btn.removeClass('btn-success border-success').addClass('btn-primary-custom');
            }, 2000);
        });
    });
});

// ==========================================
// REGISTRO DE NUEVOS ORGANIZADORES
// ==========================================
$('#form-registro-organizador').on('submit', function(e) {
    e.preventDefault(); 

    const correo = $('#reg-correo').val();
    const password = $('#reg-password').val();

    $.ajax({
        url: 'php/registrar_organizador.php', 
        method: 'POST',
        data: { correo: correo, password: password }, 
        dataType: 'json',
        success: function(response) {
            if(response.status === 'success') {
                Swal.fire({
                    title: '¡REGISTRO EXITOSO!',
                    text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
                    icon: 'success',
                    customClass: {
                        popup: 'alerta-rosa-popup',
                        title: 'alerta-rosa-titulo',
                        htmlContainer: 'alerta-rosa-texto',
                        confirmButton: 'alerta-rosa-btn-confirmar'
                    },
                    buttonsStyling: false
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } else {
                Swal.fire({
                    title: 'Atención',
                    text: response.message,
                    icon: 'warning',
                    customClass: {
                        popup: 'alerta-rosa-popup',
                        title: 'alerta-rosa-titulo',
                        htmlContainer: 'alerta-rosa-texto',
                        confirmButton: 'alerta-rosa-btn-confirmar'
                    },
                    buttonsStyling: false
                });
            }
        },
        error: function() {
            Swal.fire({ 
                title: 'Error de conexión', 
                text: 'No se pudo conectar con el servidor. Revisa tu consola.', 
                icon: 'error' 
            });
        }
    });
});