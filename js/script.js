// ==========================================
// VARIABLES GLOBALES
// ==========================================
let selectActual = null;
let filaEditando = null;
let zoomLevel = 1.0;
let menuChartInstance = null;

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
                alert("No se pudo cargar el evento: " + response.message);
                window.location.href = 'dashboard.html'; 
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
                    const numMesaText = invitado.id_mesa ? `Mesa ${invitado.id_mesa}` : 'S/A';
                    
                    const filaHtml = `
                        <tr class="fila-invitado" data-id="${invitado.id_invitado}">
                            <td class="td-nombre">${invitado.nombre_completo}</td>
                            <td><span class="badge bg-light text-dark border">Principal</span></td>
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
        $('#tituloModalInvitado').text("Agregar Invitado");
        $('#inv-nombre').val('');
        $('#inv-menu').val('');
        $('#inv-mesa').val('S/A');
    } 
    new bootstrap.Modal('#modalInvitado').show();
}

function eliminarOpcionSelect(selectId) {
    const val = $(selectId).val();
    if(val) $(`${selectId} option[value='${val}']`).remove();
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
    if (idEvento) {
        cargarDetalleEvento(idEvento); 
        cargarMesas(); // Esto arrancará las mesas y los invitados en el orden perfecto
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

        if(!nombre || !fecha || !lugar) return alert("Completa los campos.");
        
        $.ajax({
            url: 'php/crear_evento.php',
            method: 'POST',
            data: { nombre: nombre, fecha: fecha, lugar: lugar },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    alert(response.message); 
                    const modalElement = document.getElementById('modalCrearEvento');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();

                    $('#nombre-ev').val('');
                    $('#fecha-ev').val('');
                    $('#lugar-ev').val('');
                    cargarEventos();
                } else {
                    alert("Error al guardar en BD: " + response.message);
                }
            },
            error: function() { alert("No se pudo conectar con el servidor."); }
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
                        alert("Error al guardar: " + response.message);
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
                    } else {
                        alert("Error: " + response.message);
                    }
                }
            });
        }
    });

    $(document).on('click', '.remove-menu-card', function() {
        $(this).closest('.menu-card-item').fadeOut(200, function() { $(this).remove(); });
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
                    alert('¡Tus cambios se han guardado!');
                    $('#titulo-evento, #display-event-name').text(data.nombre);
                } else { 
                    alert('Error al guardar: ' + response.message); 
                }
            },
            error: function(xhr) {
                alert("El servidor detuvo el guardado. Error exacto: " + xhr.responseText);
            }
        });
    });

    $('#btn-eliminar-evento').off('click').on('click', function() {
        if(confirm("¿Estás seguro de eliminar TODO el evento? Esto no se puede deshacer.")) {
            const id_evento = new URLSearchParams(window.location.search).get('id_evento');
            $.ajax({
                url: 'php/eliminar_evento.php', method: 'POST', data: { id_evento: id_evento }, dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        window.location.href = 'dashboard.html';
                    } else { alert('Error al eliminar: ' + response.message); }
                }
            });
        }
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
                    alert("Error: " + response.message);
                }
            },
            error: function(xhr) {
                alert("Error del servidor: " + xhr.responseText);
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

        if(invSelected.length === 0) return alert("Selecciona un invitado lateral.");
        if(mesaSel.length === 0) return alert("Selecciona una mesa en el plano.");

        const idInvitado = invSelected.data('id');
        const idMesa = mesaSel.data('id-mesa'); 

        const max = parseInt(mesaSel.data('capacidad'));
        const actuales = mesaSel.find('.guest-item').length;
        if(actuales >= max) return alert("Mesa llena.");

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
                    $(`tr[data-id="${idInvitado}"] .td-mesa`).text('Mesa ' + idMesa);
                    actualizarAnalitica();
                } else {
                    alert("Error al asignar: " + response.message);
                }
            }
        });
    });

    $('#btn-quitar-invitado').off('click').on('click', function() {
        const invEnMesa = $('.mesa-card .guest-item.selected');
        if(invEnMesa.length === 0) return alert("Selecciona un invitado dentro de una mesa.");

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
                    alert("Error al quitar asignación: " + response.message);
                }
            }
        });
    });

    $('#btn-eliminar-mesa-seleccionada').off('click').on('click', function() {
        const mesaSel = $('.mesa-card.selected');
        if(mesaSel.length === 0) return alert("Selecciona mesa a eliminar.");

        if(confirm("¿Estás seguro de eliminar esta mesa? Los invitados regresarán a la lista de 'Sin asignar'.")) {
            const idMesa = mesaSel.data('id-mesa');

            $.ajax({
                url: 'php/eliminar_mesa.php',
                method: 'POST',
                data: { id_mesa: idMesa },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        //Regresamos los invitados al panel derecho
                        mesaSel.find('.guest-item').each(function() {
                            const gId = $(this).data('id');
                            $(`tr[data-id="${gId}"] .td-mesa`).text('S/A').addClass('text-muted');
                        });
                        mesaSel.find('.guest-item').appendTo('#lista-invitados-sin-asignar');
                        
                        //Eliminamos la mesa 
                        mesaSel.remove();
                        
                        // 3. Borramos sus coordenadas
                        localStorage.removeItem('mesa_pos_evento_' + idMesa);
                        
                        actualizarAnalitica();
                    } else {
                        alert("Error al eliminar: " + response.message);
                    }
                }
            });
        }
    });

    $('#btn-exportar-mapa').off('click').on('click', function() {
        const btn = $(this);
        const originalText = btn.html();

        if (typeof html2canvas === 'undefined') {
            alert("Error: La librería html2canvas no cargó. Verifica que pusiste el <script> en tu gestion.html.");
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
            alert("Hubo un problema al generar la imagen. Presiona F12 para ver la consola.");
            console.error("Error de html2canvas:", err);
            
            btn.html(originalText);
            btn.prop('disabled', false);
            $('#workspace-mesas').css('transform', `scale(${zoomAnterior})`);
        });
    });

    $(document).on('shown.bs.tab', 'button[data-bs-target="#tab-reportes"]', function() {
        actualizarAnalitica();
    });

    //Eliminar Invitado
    $(document).on('click', '.btn-eliminar-invitado', function() {
        if(confirm("¿Estás seguro de que deseas eliminar a este invitado?")) {
            const idInvitado = $(this).data('id');
            $.ajax({
                url: 'php/eliminar_invitado.php',
                method: 'POST',
                data: { id_invitado: idInvitado },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        cargarInvitados(); 
                    } else {
                        alert("Error: " + response.message);
                    }
                }
            });
        }
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
            alert("El nombre del invitado no puede estar vacío.");
            return;
        }

        // validacion
        if (id_mesa !== 'S/A') {
            const mesaSeleccionada = $(`#mesa-db-${id_mesa}`);
            if (mesaSeleccionada.length > 0) {
                const maximo = parseInt(mesaSeleccionada.data('capacidad'));
                const actuales = mesaSeleccionada.find('.guest-item').length;
                
                if (actuales >= maximo) {
                    alert(`¡Alto ahí! La Mesa ${mesaSeleccionada.find('.mesa-header').text().replace('Mesa ', '')} ya está a su máxima capacidad (${maximo}/${maximo}). Elige otra mesa o guárdalo como Sin asignar.`);
                    return; // Detiene el proceso y no guarda nada
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
                    alert("Error al guardar: " + response.message);
                }
            },
            error: function(xhr) {
                alert("Error crítico del servidor: " + xhr.responseText);
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

    // --- EVENTOS DE INVITADO (invitado.html) ---
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

