<?
foreach ($accounts as $accountid => $row) {
	print $row['ebayuserid'].':'
		. '<a href="/users/import/'.$row['ebayuserid'].'/" target="_blank">import</a><br>';
}
?>
<a href="https://signin.sandbox.ebay.com/ws/eBayISAPI.dll?SignIn&runame=Yoshihiro_Watan-Yoshihir-1b29-4-nstdpc">regacc</a>

<br><br>

<div style="">
→
<a href="" onclick="chkall();return false;">全て</a>
<a href="" onclick="unchkall();return false;">リセット</a>
→
<a href="" onclick="submititems();return false;">submit</a>
<a href="" onclick="copyitems();return false;">copy</a>
<a href="" onclick="update();return false;">update</a>
<div id="delete">delete</div>

</div>

<div style="float:left;">
<table class="items">
<tr id="r0">
<th>&nbsp;</th>
<th>管理ID</th>
<th>eBayアカウント</th>
<th>eBay商品ID</th>
<th>終了日</th>
<th>タイトル</th>
<th>開始価格</th>
<th>画像</th>
</tr>
<?
foreach ($items as $i => $arr) {
	
	$row = $arr['items'];
	$iid = $row['itemid'];
	
	echo '<tr id="r'.$iid.'">'."\n";
	
	echo '<td id="r'.$iid.'cb">';
	echo '<input type="checkbox" name="item[]" value="'.$iid.'">';
	echo '</td>'."\n";
	
	echo '<td id="r'.$iid.'ii">'.$iid.'</td>'."\n";
	echo '<td id="r'.$iid.'eu">'.$arr['accounts']['ebayuserid'].'</td>'."\n";
	echo '<td id="r'.$iid.'ei">'
		. '<a href="'.$row['viewitemurl'].'" target="_blank">'.$row['ebayitemid'].'</a>'
		. '</td>'."\n";
	echo '<td id="r'.$iid.'et">';
	if (substr($row['endtime'], 0, 10) == date('Y-m-d')) {
		echo substr($row['endtime'], 11, 5);
	} else {
		echo substr($row['endtime'], 5, 2).'/'.substr($row['endtime'], 5, 2);
	}
	echo '</td>'."\n";
	echo '<td id="r'.$iid.'tt"><a href="" class="title">'.$row['title'].'</a></td>'."\n";
	echo '<td id="r'.$iid.'sp" align="right">'.$row['startprice'].'</td>'."\n";
	echo '<td id="r'.$iid.'sp"></td>'."\n";
	echo '</tr>';
	echo "\n\n";
}
?>
</table>
</div>
<div style="width=300px;" id="debug">
</div>


<div id="templatewrap" style="display:none;">
<div id="template" style="display:none;">
<table class="detail">
<tr><td>ei</td><td>[ebayitemid]</td></tr>
<tr><td>st</td><td>[starttime]</td></tr>
<tr><td>st</td><td>[endtime]</td></tr>
<tr><td>tt</td><td class="edit title">[title]</td></tr>
<tr><td>ds</td><td class="edit description">[description]</td></tr>
<tr><td>img</td><td class=""><img src="[galleryurl]"><br>[galleryurl]</td></tr>
</table>
</div>
</div>


<div id="form" style="display:none;">
<form name="itemform">
<table class="detail">
<tr>
	<td>**ei**</td>
	<td>
		[ebayitemid]
	</td>
</tr>
<tr>
	<td>**st**</td>
	<td>[starttime]</td>
</tr>
<tr>
	<td>**st**</td>
	<td>[endtime]</td>
</tr>
<tr>
	<td>**title**</td>
	<td class="formtitle">
	<input class="form" name="title" type="text" size="50">
	</td>
</tr>
<tr>
	<td>**title**</td>
</tr>
<tr>
	<td>**description**</td>
	<td class="formdescription">
	<textarea class="form" name="description" cols="90" rows="5"></textarea>
	</td>
</tr>
</table>
</form>
</div>
