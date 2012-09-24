<?php

$list = scandir("../exports/");
$exports = array();
$len = count($list);

for ($i = 0; $i < $len; $i++)
{
	$elt = $list[$i];
	$firstchar = substr($elt, 0, 1);
	if ($firstchar != ".")
	{
		array_push($exports, $elt);
	}
}

echo(json_encode($exports));
?>