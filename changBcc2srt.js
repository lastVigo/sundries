/**
 * 这是将B站视频资源处理的一个步骤。
 * 执行这个文件，会把下载下来的b站字幕（bcc文件，其实是json）文件转换为srt字幕文件。
 * bcc文件（下面称为json文件）是以视频剧集序号命名的，比如“5.json”
 * flv文件是以P+剧集序号+标题+后缀命名的
 * 要生成的srt文件需要和flv文件名称一致（也就是只有后缀不同）才能保证播放器能正确加载，
 * 同时srt文件内容依据json文件内容生成，关键点是把字幕项出现的时间格式做转换。
 * 比如把这样的格式
 *  "from": 1.01,
 *  "to": 6.02,
 * 处理成这样的：
 * 00:00:01,010 --> 00:00:06,020
 */
const  path= require('path')
const fs=require('fs')
const workpath="."
/**
 * 根据json文件名称，得到flv视频文件名称和srt字幕文件名称
 * @param {*} jName 
 * @param {*} flvFiles 
 * @returns 
 * {
 *  flvName:flv视频文件名称
 *  srtName：srt字幕文件名称
 * }
 */
const findNamesByjson=(jName,flvFiles)=>{
    let numName = jName
      .replace(/^p/, "")
      .replace(/^P/, "")
      .replace(/\.json$/, "");
    for(let i=0;i<flvFiles.length;i++){
        let fName = flvFiles[i]
        
        let reg = new RegExp("^P" + numName + "_");
        if(reg.test(fName)){
            // console.log(fName)
            return {
                flvName:fName,
                srtName:fName.replace(/\.flv$/,'.srt')
            }
        }
    }                 
}
/**
 * 得到目标目录下的三种文件数组
 * @param {*} dir 目标目录
 * @returns 
 * {
 *  flvfFiles：flv 视频文件 <br>
 *  jsonFiles：json字幕文件
 *  srtFiles：srt 字幕文件
 * }
 */
const getFiles=(dir)=>{
    let files = fs.readdirSync(dir) //同步拿到文件目录下的所有文件名
    let fArr=[],jArr=[],sArr=[]
    files.forEach(item=>{
        let fileName=item+''
        if(/\.json$/.test(fileName)){
            jArr.push(fileName);
        }
        if(/\.srt$/.test(fileName)){
            sArr.push(fileName)
        }
        if(/\.flv$/.test(fileName)) {
          fArr.push(fileName);
        }
    })
    return {
      flvfFiles:fArr,
      jsonFiles:jArr,
      srtFiles:sArr
    };
}
/**
 * 把数字num转化为长度为length的字符串
 * @param {int} num 
 * @param {int} length 
 * @returns 
 */
const fillStr=(num,length)=>{
    let str=num+''
    // console.log('>>',str)
    if(str.length<length){
        let temp=str
        while(temp.length<length){
            temp="0"+temp
        }
        debugger
        return temp
    }else {
        debugger
        return str
    }
}

/**
 * 主要流程
 */
// 获得指定目录中flv和json，srt三类文件的数组
let { flvfFiles,jsonFiles,srtFiles } = {...getFiles(workpath)};
// console.log(flvfFiles, jsonFiles, srtFiles);

// 遍历json文件数组
for(let i=0;i<jsonFiles.length;i++){
    let item=jsonFiles[i]
    // 根据json文件查找到flv视频文件名称和要生成的srt文件名称
    let { flvName, srtName } = findNamesByjson(item, flvfFiles);
    // 根据上述名称，生成对应的文件路径
    let srtFilePath = path.join(workpath, srtName);
    let jsonFilePath=path.join(workpath,item)
    // 检查是否已经生成了srt文件，没有srt文件才做处理
    if (!fs.existsSync(srtFilePath)) {
      let rawdata = fs.readFileSync(jsonFilePath);
      // 读取json文件内容
      let jsonData = JSON.parse(rawdata);
      console.log(jsonData.body.length);
      // 准备操作 字幕项
      let subItems = jsonData.body;
      let  srt_file=""
      for(let j=0;j<subItems.length;j++){
        let sub = subItems[j];
        let index = j + 1; // 生成字幕序号
        let start = sub.from; // 暂存字幕出现开始时间
        let stop = sub.to; // 暂存字幕消失时间
        let content = sub.content; // 暂存字幕内容

        let hour = Math.floor(Math.floor(start) / 3600); // start整数部分是分钟
        let minute = Math.floor((Math.floor(start) - hour * 3600) / 60); // 分钟数值
        let sec = Math.floor(start) - hour * 3600 - minute * 60; // 秒钟数值
        let minisec; // 处理开始时间

        // console.log(start,hour, minute, sec, minisec);
        // 如果时间有有效小数部分
        if (start != Math.floor(start)) {
          let temp = start + "";
          minisec = parseInt(temp.split(".")[1]) * 10; // 得到毫秒数值
        } else {
          // 如果时间没有有效小数部分
          minisec = 0;
        }
        srt_file += "\n" + index + "\n";
        srt_file +=
          fillStr(hour, 2) +
          ":" +
          fillStr(minute, 2) +
          ":" +
          fillStr(sec, 2) +
          "," +
          fillStr(minisec, 3); // 将数字填充0并按照格式写入
        srt_file += " --> ";

        hour = Math.floor(Math.floor(stop) / 3600);
        minute = Math.floor((Math.floor(stop) - hour * 3600) / 60);
        sec = Math.floor(stop) - hour * 3600 - minute * 60;
        //  minisec =Math.floor(100*(stop-Math.floor(stop)-1) ) // 此处减1是为了防止两个字幕同时出现
        if (stop != Math.floor(stop)) {
          let temp = stop + "";
          minisec = parseInt(temp.split(".")[1]) * 10;
        } else {
          minisec = 0;
        }
        srt_file +=
          fillStr(hour, 2) +
          ":" +
          fillStr(minute, 2) +
          ":" +
          fillStr(sec, 2) +
          "," +
          fillStr(minisec, 3);
        srt_file += "\n" + content + "\n\n"; // 加入字幕文字
      }
      fs.writeFileSync(srtFilePath, srt_file)
    }
}
