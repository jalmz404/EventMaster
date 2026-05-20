<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

//Verificamos que el usuario realmente haya iniciado sesión
if (!isset($_SESSION['id_organizador'])) {
    echo json_encode(["status" => "error", "message" => "Sesión expirada. Por favor inicia sesión de nuevo."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : null;
    $fecha  = isset($_POST['fecha']) ? trim($_POST['fecha']) : null;
    $lugar  = isset($_POST['lugar']) ? trim($_POST['lugar']) : null;
    
    //Tomamos el ID del organizador de su sesión
    $id_organizador = $_SESSION['id_organizador'];

    if (!$nombre || !$fecha || !$lugar) {
        echo json_encode(["status" => "error", "message" => "Por favor, completa todos los campos."]);
        exit;
    }

    try {
        //Actualizamos la consulta
        $query = "INSERT INTO eventos (nombre, fecha, lugar, id_organizador) VALUES (:nombre, :fecha, :lugar, :id_organizador)";
        $stmt = $conexion->prepare($query);
        
        // Vincular parámetros
        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":fecha", $fecha);
        $stmt->bindParam(":lugar", $lugar);
        $stmt->bindParam(":id_organizador", $id_organizador); 
        
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