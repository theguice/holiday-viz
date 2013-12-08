<?php
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$q = $_GET['q'];
 $url = $q;
$ch = curl_init($urlx);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, 0);
$data = curl_exec($ch);
curl_close($ch);
var_dump(($data));
echo($data)

/*
     $json = file_get_contents($url);
     $data = json_decode($json, true);
echo($json);*/
?>

