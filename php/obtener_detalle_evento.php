<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

if (!isset($_SESSION['id_organizador'])) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$id_evento = $_GET['id'] ?? null;
if (!$id_evento) {
    echo json_encode(["status" => "error", "message" => "ID de evento no proporcionado"]);
    exit;
}

try {
    $id_organizador = $_SESSION['id_organizador'];
    
    //Extraer los datos del evento
    $queryEvento = "SELECT * FROM eventos WHERE id_evento = :id_evento AND id_organizador = :id_organizador";
    $stmt = $conexion->prepare($queryEvento);
    $stmt->execute([':id_evento' => $id_evento, ':id_organizador' => $id_organizador]);
    $evento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$evento) {
        echo json_encode(["status" => "error", "message" => "Evento no encontrado."]);
        exit;
    }

    //Extraer los catálogos
    $tipos = $conexion->query("SELECT id_tipo_evento, nombre_tipo FROM tipos_evento")->fetchAll(PDO::FETCH_ASSOC);
    $vestimentas = $conexion->query("SELECT id_tipo_vestimenta, nombre_vestimenta FROM tipos_vestimenta")->fetchAll(PDO::FETCH_ASSOC);

    //Extraer los platillos
    $queryMenus = "SELECT id_menu, nombre_platillo FROM menus WHERE id_evento = :id_evento";
    $stmtM = $conexion->prepare($queryMenus);
    $stmtM->execute([':id_evento' => $id_evento]);
    $menus = $stmtM->fetchAll(PDO::FETCH_ASSOC);

    //mandamos a javascript
    echo json_encode([
        "status" => "success", 
        "data" => [
            "evento" => $evento,
            "tipos_evento" => $tipos,
            "tipos_vestimenta" => $vestimentas,
            "menus" => $menus
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>