addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event));
});

async function handleScheduled(event) {
  const SCHOOL_ID = SCHOOL_ID;
  const STUDENT_ID = STUDENT_ID;
  const ALERT_QQ = ALERT_QQ;
  const QMSG_KEY = QMSG_KEY;
  const ALERT_THRESHOLD = ALERT_THRESHOLD;

  const response = await fetch(`https://xqh5.17wanxiao.com/smartWaterAndElectricityService/SWAEServlet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `param=%7B%22cmd%22%3A%22getbindroom%22%2C%22account%22%3A%22${STUDENT_ID}%22%7D&customercode=${SCHOOL_ID}&method=getbindroom`
  });

  const data = await response.json();
  let body = data.body;
  body = JSON.parse(body.replace(/"{/g, '{').replace(/}"/g, '}').replace(/\\"/g, '"'));
  const roomAmount = body.roomlist ? body.roomlist.length : 1;
  const singleRoom = !body.roomlist;

  let msg = `[电费不足提醒]目前与您的学号 ${STUDENT_ID.slice(0, 4)}****** 绑定的以下房间，剩余电量不足 ${ALERT_THRESHOLD} 度，请及时缴纳电费哦~`;
  let msgFlag = false;

  for (let i = 0; i < roomAmount; i++) {
    const room = singleRoom ? body : body.roomlist[i];
    const roomName = room.roomfullname.replace(/公寓/g, '宿舍');
    const roomOdd = parseFloat(room.detaillist[0].odd);

    if (roomOdd < ALERT_THRESHOLD) {
      msgFlag = true;
      msg += `  [${roomName}]剩余${roomOdd}度电`;
    }
  }

  if (msgFlag) {
    let QmsgFlag = false;
    let attempts = 0;

    while (!QmsgFlag && attempts < 3) {
      const res = await fetch(`https://qmsg.zendee.cn:443/send/${QMSG_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `qq=${ALERT_QQ}&msg=${msg}`
      });

      const result = await res.json();
      QmsgFlag = result.success;

      if (!QmsgFlag) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      attempts++;
    }

    if (!QmsgFlag) {
      throw new Error('Failed to send alert after 3 attempts');
    }
  }
}
