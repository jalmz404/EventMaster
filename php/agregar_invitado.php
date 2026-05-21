<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
$nombre_completo = $_POST['nombre_completo'] ?? null;
$id_menu = (!empty($_POST['id_menu'])) ? $_POST['id_menu'] : null;
// Recibimos la mesa. Si viene vacía o dice "S/A", la guardamos como null
$id_mesa = (!empty($_POST['id_mesa']) && $_POST['id_mesa'] !== 'S/A') ? $_POST['id_mesa'] : null;

if (!$id_evento || !$nombre_completo) {
    echo json_encode(["status" => "error", "message" => "El nombre es obligatorio"]); exit;
}

try {
    // Agregamos id_mesa a la consulta
    $query = "INSERT INTO invitados (id_evento, nombre_completo, id_menu, id_mesa) VALUES (:id_evento, :nombre_completo, :id_menu, :id_mesa)";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':id_evento' => $id_evento,
        ':nombre_completo' => $nombre_completo,
        ':id_menu' => $id_menu,
        ':id_mesa' => $id_mesa
    ]);

    echo json_encode(["status" => "success", "message" => "Invitado registrado"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>