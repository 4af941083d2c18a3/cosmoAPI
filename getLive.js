async function getLiveSession(num) {
    const url = `https://api.cosmo.fans/bff/v3/live-sessions/${num}`
    const data = await fetchWithAuth(url)
    return data
}

const stringifyDate = dt => {
    const d = new Date(dt);
    const y=d.getFullYear();
    const m=d.getMonth()+1;
    const da=d.getDate();
    const h=d.getHours();
    const mi=d.getMinutes();
    const s=d.getSeconds();
    return `${y}/${m.zfill(2)}/${da.zfill(2)} ${h.zfill(2)}:${mi.zfill(2)}:${s.zfill(2)}`
}

async function getLiveCsv(start) {
    const result=[]
    var num=start
    var stopCount=0
    while (true) {
        if (stopCount==5) break;
        const data = await getLiveSession(num)
        num++;
        if (data.error) {stopCount+=1;console.log('Stop Count: ' + stopCount);continue;}
        //else if (data.statusCode && data.statusCode==401) break;
        if (!data.startedAt || !data.endedAt) continue;
        stopCount=0
        result.push([
            num-1,
            data.channel.name,
            data.title,
            data.thumbnailImage,
            stringifyDate(data.startedAt),
            stringifyDate(data.endedAt),
            (new Date(data.endedAt)-new Date(data.startedAt))
        ].map(v=>'"'+v+'"'))
    }
    return result.map(v=>v.join()).join("\n")
}

async function getSingleReplay(num) {
    const res = await fetchAsRamen("https://api.cosmo.fans/bff/v3/live-clips/"+String(num))
    return {videoUrl:res.videoUrl,sessionId:res.liveSessionId}
}

async function getReplayIds(count) {
    const res = await fetchWithAuth("https://api.cosmo.fans/bff/v3/room-posts?kind=live-clip&skip=0&artistId=tripleS&take="+String(count))
    console.log("Last Element : ",res.posts[res.posts.length-1])
    return res.posts.map(v=>[v.author.nickname,v.videoItem.id])
}

async function getReplayUrls(replayIds,memberNums) {
    if (!replayIds || typeof(replayIds)!='object' || !memberNums || typeof(memberNums)!='object' || memberNums.find(i=>typeof(i)!='number')) throw new Error("input type error")
    const members = tripleS.name.filter((v,i)=>memberNums.includes(i+1))
    const arr = []
    for (let i=0;i<replayIds.length;i++) {
        const seeing = replayIds[i]
        if (!members.includes(seeing[0])) continue;
        const single = await getSingleReplay(seeing[1])
        arr.push(single)
    }
    const min = Math.min(...arr.map(v=>v.sessionId).filter(i=>i))
    const max = Math.max(...arr.map(v=>v.sessionId))
    console.log("starts from "+min)
    return range(min,max+1).map(v=>{
        const t=arr.find(i=>i.sessionId==v)
        return t?t.videoUrl:""
    }).join('\n')
}