<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
$titulo = $_POST['titulo'] ?? '';
$mensaje = $_POST['mensaje'] ?? '';

if (!$id_evento) {
    echo json_encode(["status" => "error", "message" => "ID del evento requerido"]);
    exit;
}

try {

    $query = "UPDATE eventos SET titulo_invitacion = :titulo, mensaje_invitacion = :mensaje WHERE id_evento = :id_evento";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':titulo' => $titulo,
        ':mensaje' => $mensaje,
        ':id_evento' => $id_evento
    ]);

    echo json_encode(["status" => "success", "message" => "Textos de invitación guardados correctamente."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>