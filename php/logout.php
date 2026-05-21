<?php
session_start();
//Destruimos todas las variables de sesión
session_destroy();
//Lo mandamos de regreso al login
header("Location: ../login.html");
exit;
?>