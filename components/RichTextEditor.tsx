import React, { useContext, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../context/ThemeContext';

interface Props {
  value: string;
  onChangeValue: (html: string) => void;
}

export function RichTextEditor({ value, onChangeValue }: Props) {
  const { colors } = useContext(ThemeContext);
  const webViewRef = useRef<WebView>(null);
  // Keep latest value accessible in onLoad without triggering re-inject
  const valueRef = useRef(value);
  valueRef.current = value;

  const source = useMemo(() => {
    const a = colors.accent;
    return {
      html: `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:${colors.bg}}
body{display:flex;flex-direction:column;height:100%}
#s{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
#e{
  min-height:100%;padding:16px 16px 32px;outline:none;
  font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:32px;
  color:${colors.text};white-space:pre-wrap;word-break:break-word;
  -webkit-user-select:text;user-select:text;cursor:text
}
#tb{
  flex-shrink:0;display:flex;align-items:center;
  padding:0 10px;height:48px;gap:0;
  border-top:1px solid ${colors.bright}28;background:${colors.bg}
}
.fb{
  width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  -webkit-tap-highlight-color:transparent;color:${colors.bright};font-size:15px;cursor:pointer
}
.fb.b{font-family:Georgia,serif;font-weight:700;font-style:normal}
.fb.i{font-family:Georgia,serif;font-style:italic}
.sp{width:1px;height:18px;background:${colors.bright};opacity:.18;margin:0 6px}
.cb{
  width:18px;height:18px;border-radius:50%;margin:0 3px;cursor:pointer;
  flex-shrink:0;-webkit-tap-highlight-color:transparent
}
.cc{
  flex:1;text-align:right;font-family:-apple-system,sans-serif;
  font-size:10px;color:${colors.bright};opacity:.35;pointer-events:none
}
</style>
</head><body>
<div id="s"><div id="e" contenteditable="true"></div></div>
<div id="tb">
  <div class="fb b" data-cmd="bold">B</div>
  <div class="fb i" data-cmd="italic">I</div>
  <div class="sp"></div>
  <div class="cb" data-clr="${a}"     style="background:${a}"></div>
  <div class="cb" data-clr="#C4874A" style="background:#C4874A"></div>
  <div class="cb" data-clr="#C05A5A" style="background:#C05A5A"></div>
  <div class="cb" data-clr="#5E7A8A" style="background:#5E7A8A"></div>
  <div class="cb" data-clr="#68A86A" style="background:#68A86A"></div>
  <div class="cc" id="cc">0 / ∞</div>
</div>
<script>
var e=document.getElementById('e'),
    cc=document.getElementById('cc'),
    tb=document.getElementById('tb');

function upd(){cc.textContent=(e.innerText||'').replace(/\\n$/,'').length+' / ∞'}
function post(){window.ReactNativeWebView.postMessage(JSON.stringify({t:'c',h:e.innerHTML}))}
function execCmd(cmd){document.execCommand(cmd,false,null);post()}
function applyColor(hex){
  var s=window.getSelection();
  if(!s||s.isCollapsed)return;
  document.execCommand('foreColor',false,hex);
  post()
}

e.addEventListener('input',function(){upd();post()});

// Prevent toolbar touches from stealing focus / clearing selection
tb.addEventListener('touchstart',function(ev){ev.preventDefault()},{passive:false});
tb.addEventListener('touchend',function(ev){
  ev.preventDefault();
  var el=ev.target.closest('[data-cmd],[data-clr]');
  if(!el)return;
  if(el.dataset.cmd)execCmd(el.dataset.cmd);
  else if(el.dataset.clr)applyColor(el.dataset.clr);
},{passive:false});

// Keep toolbar above keyboard on iOS using visualViewport
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',function(){
    document.body.style.height=window.visualViewport.height+'px';
  });
}
</script>
</body></html>`,
    };
  }, [colors.bg, colors.text, colors.bright, colors.accent]);

  function handleLoad() {
    // Inject the current draft HTML after the page loads
    const safe = JSON.stringify(valueRef.current || '');
    webViewRef.current?.injectJavaScript(`e.innerHTML=${safe};upd();true;`);
  }

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.t === 'c') onChangeValue(data.h);
    } catch {}
  }

  return (
    <WebView
      ref={webViewRef}
      source={source}
      onLoad={handleLoad}
      onMessage={handleMessage}
      scrollEnabled={false}
      keyboardDisplayRequiresUserAction={false}
      style={styles.root}
      originWhitelist={['*']}
      bounces={false}
      overScrollMode="never"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
