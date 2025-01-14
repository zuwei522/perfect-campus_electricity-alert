addEventListener('scheduled', event => {
  event.waitUntil(handleScheduledEvent());
});

async function handleScheduledEvent() {
  const SCHOOL_ID = SCHOOL_ID;
  const STUDENT_ID = STUDENT_ID;
  const ALERT_QQ = ALERT_QQ;
  const QMSG_KEY = QMSG_KEY;
  const ALERT_THRESHOLD = ALERT_THRESHOLD;

  const response = await fetch("https://xqh5.17wanxiao.com/smartWaterAndElectricityService/SWAEServlet", {
    method: 'POST',
    body: new URLSearchParams({
      param: JSON.stringify({ cmd: "getbindroom", account: STUDENT_ID }),
      customercode: SCHOOL_ID,
      method: "getbindroom"
    })
  });

  let body = await response.json();
  body = JSON.parse(body.body.replace(/"{/g, '{').replace(/}"/g, '}').replace(/\\"/g, '"'));
  const roomAmount = body.roomlist ? body.roomlist.length : 1;
  const singleRoom = roomAmount === 1 && !body.roomlist;

  const rooms = [];
  for (let i = 0; i < roomAmount; i++) {
    const room = singleRoom ? body : body.roomlist[i];
    const detail = room.detaillist[0];
    rooms.push({
      name: room.roomfullname.replace(/公寓/g, '宿舍'),
      use: detail.use,
      odd: detail.odd,
      status: detail.status === 1 ? "一般送电" : "一般断电"
    });
  }

  let msg = `[电费不足提醒]目前与您的学号 ${STUDENT_ID.slice(0, 4)}****** 绑定的以下房间，剩余电量不足 ${ALERT_THRESHOLD} 度，请及时缴纳电费哦~`;
  let msgFlag = false;

  for (const room of rooms) {
    if (parseFloat(room.odd) < ALERT_THRESHOLD) {
      msgFlag = true;
      msg += `  [${room.name}]剩余${room.odd}度电`;
    }
  }

  if (msgFlag) {
    let QmsgFlag = false;
    let attempts = 0;

    while (!QmsgFlag && attempts < 3) {
      const res = await fetch(`https://qmsg.zendee.cn:443/send/${QMSG_KEY}`, {
        method: 'POST',
        body: new URLSearchParams({
          qq: ALERT_QQ,
          msg: msg
        })
      });

      const result = await res.json();
      QmsgFlag = result.success;

      if (!QmsgFlag) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      attempts++;
    }

    if (!QmsgFlag) {
      throw new Error("Failed to send alert message after 3 attempts");
    }
  }
}
