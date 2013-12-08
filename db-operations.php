<?php
$q = $_GET['q'];
$con = mysqli_connect("localhost","jannah","podiumapp","jannah");
/*
 if (!$con)
  {
  die('Could not connect: ' . mysqli_error($con));
  }
*/

try
{
    mysqli_select_db($con,"jannah");
    $result = mysqli_query($con,$q);
    while($row = mysqli_fetch_assoc($result)) 
    {
     $rows[] = $row;
    };
    echo json_encode($rows);


    mysqli_close($con);
}catch(Exception $e)
{
    echo("Error\r\n");
    echo ($e);
}


?>