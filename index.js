const accounts = JSON.parse(localStorage.accounts)
let token = accounts.accounts[9].credentials.accessToken

// async function jsonCall(path,query) {
//     const url = 'https://api.cosmo.fans/'+path+query
//     const data = auth ? await fetch(url,{headers:{'Authorization':'Bearer '+token,'Accept-Language':'ko'}}) : await fetch(url,{headers:{'Accept-Language':'ko'}})
//     const json = await data.json()
//     document.querySelector('#json').innerText = JSON.stringify(json, null, 2)
// }

async function bffCall(path) {
    const urlParts = path.split('?');
    let finalPath = urlParts[0];
    if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const keysToDelete = [];
        for (const [key, value] of params.entries()) {
            if (value === "" || value === "undefined" || value === "null" || value === "_comment_only") {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => params.delete(key));
        const qs = params.toString();
        if (qs) finalPath += '?' + qs;
    }

    finalPath = finalPath.replace(/\/+$/, '').replace(/\/\?/, '?');
    const url = 'https://api.cosmo.fans/bff/' + finalPath;
    
    const json = await fetchWithAuth(url)
    document.querySelector('#json').innerText = JSON.stringify(json, null, 2)
}

async function fetchWithAuth(url, options, accessToken) {
    const authOptions = {
        ...options
    }
    if (!authOptions.headers) authOptions.headers = {}
    authOptions.headers["Authorization"] = `Bearer ${accessToken?.replace('Bearer ','') || token}`
    authOptions.headers["Accept-Language"] = authOptions.headers["Accept-Language"] || `ko`
    const data = await fetch(url, authOptions)
    const json = await data.json()
    if (data.status != 200) {
        console.error("API 요청 실패:", url, json)
        // throw new Error("API 요청 실패")
    }
    return json
}

async function fetchAsRamen(url, options) {
    return await fetchWithAuth(url, options, accounts.accounts[0].credentials.accessToken)
}

function input(id) {
    return document.querySelector('#'+id).value.replace(/\s+$/,'')
}

function encryptRefreshTokenBody(refreshToken) {
    const BASE64_ENCRYPTION_KEY = localStorage.encryptionKey
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.enc.Base64.parse(BASE64_ENCRYPTION_KEY);
    const plaintext = JSON.stringify({ refreshToken: refreshToken });
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const combined = iv.clone().concat(encrypted.ciphertext);
    return CryptoJS.enc.Base64.stringify(combined);
}

async function main() {
    const inputArray = document.querySelectorAll('input')
    inputArray.forEach(i=>{
        i.style.width = i.placeholder.length*7.703125+16 +'px'
        i.addEventListener('input',e=>{
            if (i.value.length) {
                i.style.width = i.value.length*7.703125+16 + 'px'
            } else {
                i.style.width = i.placeholder.length*7.703125+16 +'px'
            }
            // console.log(e.data)
        })
    })

    const updatedAt = new Date(accounts.updatedAt)
    if (new Date()-updatedAt > 1000*60*60*24*6) {
        //let count = 0
        accounts.updatedAt = new Date().toJSON()
        //accounts.accounts.forEach(async i=>{
        for (let k=0;k<accounts.accounts.length;k++) {
            const i = accounts.accounts[k]
    
            const body = encryptRefreshTokenBody(i.credentials.refreshToken);
            const d = await fetch('https://api.cosmo.fans/bff/v3/users/refresh-access-token', {
                "headers": {
                    "content-type": "text/plain",
                    "x-cosmo-encrypted" : 1,
                },
                "body": body,
                "method": "POST"
            })
            if (d.status!=201 && d.status!=200) {
                continue;
            }
            const j = await d.json()
            if (j) {
                i.credentials = j.credentials
                //count++
                if (i.id == "080108") {
                    token = j.accessToken
                }
            }
        }
    
        localStorage.accounts = JSON.stringify(accounts)
    }
}

main()