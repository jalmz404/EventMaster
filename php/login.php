<?php
session_start();
header('Content-Type: application/json');
require_once "conexion.php";

$correo = $_POST['correo'] ?? '';
$password = $_POST['password'] ?? '';

//Validación
if (empty($correo) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Por favor, llena todos los campos."]);
    exit;
}

try {
    //Buscamos al organizador por su correo
    $query = "SELECT id_organizador, password FROM organizadores WHERE correo = :correo";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':correo' => $correo]);
    
    $organizador = $stmt->fetch(PDO::FETCH_ASSOC);

    //Verificamos si existe el correo Y si la contraseña coincide
    if ($organizador && password_verify($password, $organizador['password'])) {
        
        //Guardamos su ID en la sesión 
        $_SESSION['id_organizador'] = $organizador['id_organizador'];
        
        echo json_encode(["status" => "success"]);
    } else {
        // Falló la contraseña o el correo no existe. 
        echo json_encode(["status" => "error", "message" => "Correo o contraseña incorrectos."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error de base de datos: " . $e->getMessage()]);
}
?>