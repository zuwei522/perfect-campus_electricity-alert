#!/bin/bash
    
# SCHOOL_ID=        # 学校编号
# STUDENT_ID=       # 学号
# ALERT_QQ=         # 要推送的 QQ
# QMSG_KEY=         # Qmsg 酱推送Key 获取方法：https://qmsg.zendee.cn/user 登录Qmsg控制台即可获取我的KEY，选择并添加可用的Qmsg酱的QQ好友，即可接收到消息推送
# ALERT_THRESHOLD=  # 低电量提醒阈值

body=$(curl -sd "param=%7B%22cmd%22%3A%22getbindroom%22%2C%22account%22%3A%22${STUDENT_ID}%22%7D&customercode=${SCHOOL_ID}&method=getbindroom" "https://xqh5.17wanxiao.com/smartWaterAndElectricityService/SWAEServlet" | jq .body) # 从完美校园获取信息

body=$(echo $(echo $(echo $body | sed 's/"{/{/g') | sed 's/}"/}/g') | sed 's/\\"/"/g')  # 手动整理 json 格式
roomAmount=$(echo $body | jq '.roomlist|length')    # 获取绑定的房间数量

# 判断是否只绑定一个宿舍
singleRoom=false
if [[ roomAmount -eq 0 ]]; then
    roomAmount=1
    singleRoom=true
fi

# 依次提取 json 中的数据
for((i=0;i<$roomAmount;i++))    
do
    if [ "$singleRoom" == "true" ];then   # 处理没有roomlist的情况
        roomName[$i]=$(echo $(echo $body | jq .roomfullname) | sed 's/"//g')   # 房间名
    	roomUse[$i]=$(echo $(echo $body | jq .detaillist[0].use) | sed 's/"//g')   # 已使用电量
    	roomOdd[$i]=$(echo $(echo $body | jq .detaillist[0].odd) | sed 's/"//g')   # 剩余电量
    	roomStatusCode[$i]=$(echo $(echo $body | jq .detaillist[0].status) | sed 's/"//g') # 状态码
    else
    	roomName[$i]=$(echo $(echo $body | jq .roomlist[$i].roomfullname) | sed 's/"//g')
    	roomUse[$i]=$(echo $(echo $body | jq .roomlist[$i].detaillist[0].use) | sed 's/"//g')
    	roomOdd[$i]=$(echo $(echo $body | jq .roomlist[$i].detaillist[0].odd) | sed 's/"//g')
    	roomStatusCode[$i]=$(echo $(echo $body | jq .roomlist[$i].detaillist[0].status) | sed 's/"//g')
    fi
	# 将状态码转换为字符
	if [ ${roomStatusCode[$i]} -eq 1 ];then
            roomStatus[$i]="一般送电"
    	else
            roomStatus[$i]="一般断电"
	fi
done

msg="[电费不足提醒]目前与您的学号 ${STUDENT_ID:0:4}****** 绑定的以下房间，剩余电量不足 ${ALERT_THRESHOLD} 度，请及时缴纳电费哦~"

msgFlag=0   # 是否需要推送消息标记
for((i=0;i<$roomAmount;i++))
do
    if [ $(printf "%.0f" ${roomOdd[$i]}) -lt ${ALERT_THRESHOLD} ];then  #判断是否低于阈值
        msgFlag=1
        msg="$msg  [$(echo ${roomName[$i]} | sed 's/公寓/宿舍/g')]剩余${roomOdd[$i]}度电"
    fi
done

# 输出日志（由于 Actions 中输出的日志所有人可见，出于保护隐私目的，这段注释了）
# echo -e "[`date "+%Y-%m-%d %A %H:%M:%S"`] 学号${STUDENT_ID:0:4}****** 共绑定了$roomAmount个房间\n房间\t\t\t已使用\t剩余\t状态"
# for((i=0;i<$roomAmount;i++))
# do
#     echo -e "${roomName[$i]}\t${roomUse[$i]}\t${roomOdd[$i]}\t${roomStatus[$i]}"
# done

QmsgFlag=false  # 是否推送成功标记
i=0
while [ $msgFlag -eq 1 ] && [ "$QmsgFlag" != "true" ] && [ $i -lt 3 ]   # 若第一次推送失败，只重试 2 次
do
    # echo $(echo "向与学号 ${STUDENT_ID:0:4}****** 绑定的QQ号 ${ALERT_QQ:0:3}******** 发送消息：$msg")
    echo $(echo "电费不足，正在通过 Qmsg 酱推送消息 ... ...")
    
    res=$(curl -sd "qq=${ALERT_QQ}&msg=$msg" "https://qmsg.zendee.cn:443/send/${QMSG_KEY}")
    
    QmsgFlag=$(echo $res | jq .success)
    if [ "$QmsgFlag" == "true" ];then   # 输出是否推送成功日志
        echo "发送成功：$res"
    else
        echo "发送失败：$res"
        sleep 3
    fi
    let i++
    if [ $i -eq 3 ];then
        exit 1
    fi
done
exit 0
