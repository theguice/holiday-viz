<?php
$q = $_GET['q'];
$con = mysqli_connect("localhost","jannah","podiumapp","jannah");
/*
 if (!$con)
  {
  die('Could not connect: ' . mysqli_error($con));
  }
*/

try{
    mysqli_select_db($con,"jannah");
    $query = mysqli_query($con,$q);

    $result = $query->fetch_assoc();
echo json_encode($result);
/*    
$results = array();
    foreach($result as $row)
    {
        //echo ('looping');
        array_push($results, json_encode($row));
        //echo json_encode($row);
        //$results[] = json_encode($row);
    }

echo json_encode($results);



   
    //$row=mysqli_fetch_all($result);
    //echo json_encode($row);
    
*/

    mysqli_close($con);
}catch(Exception $e)
{
    echo("Error\r\n");
    echo ($e);
}


?>