<?php
header('Content-Type: application/json');
require_once "conexion.php";

$id = $_POST['id'] ?? null;
$tipo = $_POST['tipo_catalogo'] ?? null;

if (!$id || !$tipo) {
    echo json_encode(["status" => "error", "message" => "Faltan datos para procesar la eliminación."]);
    exit;
}

try {
    if ($tipo === 'tipo_evento') {
        $query = "DELETE FROM tipos_evento WHERE id_tipo_evento = :id";
    } else if ($tipo === 'vestimenta') {
        $query = "DELETE FROM tipos_vestimenta WHERE id_tipo_vestimenta = :id";
    } else {
        echo json_encode(["status" => "error", "message" => "Catálogo no reconocido."]);
        exit;
    }

    $stmt = $conexion->prepare($query);
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "La opción no existe."]);
    }
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["status" => "error", "message" => "No se puede eliminar porque ya hay un evento usando esta opción."]);
    } else {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>