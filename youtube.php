<?php
function cmp($a, $b)
{
    if ($a['itag'] == $b['itag'])
    {
        return 0;
    }
    return ($a['itag'] > $b['itag']) ? -1 : 1;
}
class YoutubeDownload
{
    private $youtubeInfo = array();
    public $youtubeArrayInfo = array();
    /*
    $url variable is the youtube url,
    then the video ID is parsed out and 
    the video info is retrieved. 
    */
    public function fetch($url)
    {
        if (preg_match('/v=([_0-9a-zA-Z]+)/m', $url, $videoID))
        {
            $this->youtubeInfo = explode("&",file_get_contents("http://www.youtube.com/get_video_info?video_id=".$videoID[1]."&fmt=47"));
            $this->parse();
        }
        else
        {
            $this->error( "Url not a youtube link!" );
            return array(
                "error" => "Not proper youtube video URL",
                "code" => 1
            );
        }
    }
    private function parse()
    {
        foreach( $this->youtubeInfo as $arr )
        {
            $entry = explode("=",$arr);
            $this->youtubeArrayInfo[ ( $entry[0] ) ] = urldecode($entry[1]);
            
        }
        $this->youtubeArrayInfo['streams'] = array();
        $tmpMap = explode(",",$this->youtubeArrayInfo['url_encoded_fmt_stream_map']);
        foreach($tmpMap as $tmps)
        {
            $tmpEntry = array();
            $vMap = explode("&",$tmps);
            foreach($vMap as $vs)
            {
                $entry = explode("=",$vs);
                $tmpEntry[($entry[0])] = urldecode($entry[1]);
            }
            $this->youtubeArrayInfo['streams'][] = $tmpEntry;
        }
        usort($this->youtubeArrayInfo['streams'], "cmp");
    }
    private function getHighestQuality()
    {
        $bestQuality = array();
        foreach( $this->youtubeArrayInfo['streams'] as $stream )
        {
            if ( preg_match( '/hd720/m', $stream['quality'] ) )
            {
                $bestQuality = $stream;
            }
        }
        if( count( $bestQuality) == 0 )
        {
            foreach( $this->youtubeArrayInfo['streams'] as $stream )
            {
                if ( $stream['itag']>46 && $stream['itag']<48 )
                {
                    $bestQuality = $stream;
                }
            }
        }
        return $bestQuality;
    }
    public function get()
    {
        $stream = $this->getHighestQuality();
        $url = $stream['url']."&signature=".$stream['sig'];
        return $url;
        
    }
    private function error($error)
    {
        trigger_error($error, E_USER_ERROR);
    }
}
$n = new YoutubeDownload();
$n->fetch("http://www.youtube.com/watch?v=".$_GET['yt']);
$e = $n->youtubeArrayInfo['streams'];
$arr = [];
foreach($e as $f){
	$tmp = [];
	$tmp['url'] = $f['url']."&signature=".$f['sig'];
	$tmp['quality'] = $f['quality'];
	$tmp['type'] = $f['type'];
	$arr[] = $tmp;
}
echo json_encode($arr);