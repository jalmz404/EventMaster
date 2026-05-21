<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

if (!isset($_SESSION['id_organizador'])) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]); exit;
}

$id_evento = $_POST['id_evento'] ?? null;
$nombre = $_POST['nombre'] ?? null;

if (!$id_evento || !$nombre) {
    echo json_encode(["status" => "error", "message" => "El nombre es obligatorio"]); exit;
}

$id_tipo_evento = (!empty($_POST['id_tipo_evento']) && is_numeric($_POST['id_tipo_evento'])) ? $_POST['id_tipo_evento'] : null;
$id_tipo_vestimenta = (!empty($_POST['id_tipo_vestimenta']) && is_numeric($_POST['id_tipo_vestimenta'])) ? $_POST['id_tipo_vestimenta'] : null;

try {
    $query = "UPDATE eventos SET nombre = :nombre, lugar = :lugar, fecha = :fecha, hora = :hora, 
              id_tipo_evento = :id_tipo_evento, id_tipo_vestimenta = :id_tipo_vestimenta 
              WHERE id_evento = :id_evento AND id_organizador = :id_organizador";
              
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':nombre' => $nombre, 
        ':lugar' => $_POST['lugar'] ?? null, 
        ':fecha' => $_POST['fecha'] ?? null,
        ':hora' => $_POST['hora'] ?? null, 
        ':id_tipo_evento' => $id_tipo_evento,
        ':id_tipo_vestimenta' => $id_tipo_vestimenta, 
        ':id_evento' => $id_evento,
        ':id_organizador' => $_SESSION['id_organizador']
    ]);

    echo json_encode(["status" => "success", "message" => "Evento actualizado"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>