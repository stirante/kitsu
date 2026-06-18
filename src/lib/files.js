const ALL_EXTENSIONS = [
  'ae',
  'ai',
  'avi',
  'bbmodel',
  'blend',
  'clip',
  'comp',
  'exr',
  'fla',
  'flv',
  'gif',
  'glb',
  'gltf',
  'hip',
  'jpeg',
  'jpg',
  'json',
  'kra',
  'm4v',
  'ma',
  'mb',
  'mcaddon',
  'mcworld',
  'mkv',
  'mov',
  'mp3',
  'mp4',
  'obj',
  'pdf',
  'png',
  'psd',
  'rar',
  'rev',
  'riv',
  'sai',
  'sai2',
  'sbbkp',
  'svg',
  'swf',
  'wav',
  'webm',
  'wmv',
  'zip'
]
const ALL_EXTENSIONS_STRING = ALL_EXTENSIONS.map(e => `.${e}`).join(',')

const IMG_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg']
const IMG_EXTENSIONS_STRING = IMG_EXTENSIONS.map(e => `.${e}`).join(',')

export default {
  ALL_EXTENSIONS,
  ALL_EXTENSIONS_STRING,
  IMG_EXTENSIONS,
  IMG_EXTENSIONS_STRING
}
