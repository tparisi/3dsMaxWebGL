<?php
print_r($_FILES);
return;

if ((($_FILES["file"]["type"] == "image/x-png")
|| ($_FILES["file"]["type"] == "image/png")
|| ($_FILES["file"]["type"] == "image/bmp")
|| ($_FILES["file"]["type"] == "image/jpeg")
|| ($_FILES["file"]["type"] == "image/pjpeg"))
&& ($_FILES["file"]["size"] < 2000000))
  {
  if ($_FILES["file"]["error"] > 0)
    {
    echo "Return Code: " . $_FILES["file"]["error"] . "<br />";
    }
  else
    {
    echo "Upload: " . $_FILES["file"]["name"] . "<br />";
    echo "Type: " . $_FILES["file"]["type"] . "<br />";
    echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
    echo "Temp file: " . $_FILES["file"]["tmp_name"] . "<br />";

    if (file_exists( $_FILES["file"]["name"]))
      {
      echo $_FILES["file"]["name"] . " already exists. ";
      }
    else
      {
      if (!move_uploaded_file($_FILES["file"]["tmp_name"],$_FILES["file"]["name"]))
		echo "Failed to move ".$_FILES["file"]["tmp_name"]." to ".$_FILES["file"]["name"];
	  $fname = $_FILES["file"]["name"];
	  $ext = strtolower(substr($fname,strlen($fname)-3,3));
	  echo "ext $ext\n";
		if (preg_match("/(jpg|gif|png|bmp)/",$ext))
		{
		$filename = substr($fname,0,strlen($fname)-3);
		$newfile = $filename.$ext;
		rename($fname,$newfile);
		$fname = $newfile;
		}
      echo "Stored in: " . $fname;
      }
    }
  }
else
  {
  echo "Invalid file";
  }
?>
</HTML>
