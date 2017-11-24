const fetch = require("fetch-retry");
let counter = 0;

getSize = url => {
    return fetch(url, {
      method: 'HEAD',
      'content-type': 'application/json',
      retries: 3,
      retryDelay: 1000
    })
    .then(res => {
      if (!res.ok) {
        throw Error({ err: 'Access denied' })
      } else {
        return parseInt(res.headers['_headers']['content-length'][0]);
      }
    })
    .catch(e => ({ deleted: true, size: 0 }))
}

updateAssetSize = (asseturl, size) => {
  const payload = {
    asseturl,
    size: (size.deleted) ? 0 : size,
    isDeleted: (size.deleted) ? true : false
  }
  // console.log(payload)
  return fetch('http://localhost:5555/cms/updateSize', {
      method: 'PUT',
      headers: {
      'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(res => {
      if (!res.ok) {
        throw Error(asseturl);
      } else {
        return res.json();
      }
    })
    .then(res => {
      counter++;
      console.log(`Documents updated: ${counter}, File: ${res.success.name}`)
    })
    .catch(e => console.log(`Failed file: ${e}`))
}

getAllAssets = () => {
  fetch('http://localhost:5555/cms/getAllAssets', {
    headers : {
      'content-type': 'application/json',
    }
  })
  .then(res => {
    if (!res.ok) throw Error(res.statusText);
    return res.json();
  })
  .then(res => {
    res.map(val => {
      const arr = val.split('/');
      // console.log(arr[arr.length - 1]);
      const ext = arr[arr.length - 1].split('.');
      const isGltf = ext[1] === 'gltf';
      if (isGltf) {
        const bin = val.replace('.gltf', '.bin');
        getSize(bin)
          .then(binSize => {
              getSize(val)
                .then(gltfSize => {
                  const totalGltfSize = binSize + gltfSize;
                  updateAssetSize(val, totalGltfSize);
                })
            });
      } else {
        getSize(val)
          .then(fileSize => updateAssetSize(val, fileSize))
      }
    })
  })
  .catch(e => console.error(e))
  ;
}


getAllAssets();
