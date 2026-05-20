<?php
// Este archivo se encargara de mandar el nombre, la fecha y el lugar del evento a la base de datos para que se guarde, al final le dira a JQuery si fue posible o no llevar a cabo el procredimiento 
header("Content-Type: application/json");
require_once "conexion.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : null;
    $fecha  = isset($_POST['fecha']) ? trim($_POST['fecha']) : null;
    $lugar  = isset($_POST['lugar']) ? trim($_POST['lugar']) : null;

    if (!$nombre || !$fecha || !$lugar) {
        echo json_encode(["status" => "error", "message" => "Por favor, completa todos los campos."]);
        exit;
    }

    try {
        
        $query = "INSERT INTO eventos (nombre, fecha, lugar) VALUES (:nombre, :fecha, :lugar)";
        $stmt = $conexion->prepare($query);
        
        // Vincular parámetros
        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":fecha", $fecha);
        $stmt->bindParam(":lugar", $lugar);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Evento creado exitosamente."]);
        } else {
            echo json_encode(["status" => "error", "message" => "No se pudo guardar el evento."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Error en la base de datos: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Método no permitido."]);
}
?>