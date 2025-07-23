chrome.runtime.onInstalled.addListener(()=>{
    chrome.storage.sync.get(["geminiApikey"],(result)=>{
        if(!result.geminiApikey){
            chrome.tabs.create({url:"options.html"});
        }
    })
})