# 完美校园 低电费提醒🔔

你是否曾经因为忘记检查电费，而遭遇晚上断电，还恰好处于充值系统的维护时间？ /(ㄒoㄒ)/~~  
于是，为了避免悲剧再次发生，这个**使用 Cloudflare Workers** 定时执行、借助 [Qmsg 酱](https://qmsg.zendee.cn/)发送低电费提醒的 **shell 脚本**就诞生了！ （好耶ヽ(✿ﾟ▽ﾟ)ノ

## 工作原理

- 本脚本默认在每天 12 点和 19 点，自动查询在完美校园上所绑定的所有房间或空调的剩余度数，若低于设定的阈值，就通过 Qmsg 酱向指定 QQ 推送消息。

## 开始使用

  1. Fork 本仓库到自己的名下
  2. 打开 Cloudflare Workers 控制台，创建一个新的 Worker
  3. 将 `cloudflare-worker.js` 文件中的代码复制到 Cloudflare Worker 的脚本编辑器中
  4. 配置环境变量，依次填入以下变量：

      | Name            | Value |
      | --------------- | ----- |
      | QMSG_KEY        | [点我登录 Qmsg 酱控制台](https://qmsg.zendee.cn/user)，找到并填入「我的KEY」。选择并主动添加可用的 Qmsg 酱的QQ好友，即可接收到 bot 的消息推送。|
      | ALERT_QQ        | 填入你的 QQ 号 |
      | SCHOOL_ID       | 填入你所在学校的编码👉 [点我查看学校编码](./school-list.md) |
      | STUDENT_ID      | 填入你的学号 |
      | ALERT_THRESHOLD | 填入你想要设置的提醒阈值，单位是度，例如：15 |

  5. 配置 Cron Triggers，设置每天 12 点和 19 点运行 Worker
  6. 保存并部署 Worker

## 使用 create-cloudflare-cli 优化部署流程

  1. 在 GitHub 仓库中创建一个新的 GitHub Actions workflow 文件 `.github/workflows/deploy.yml`
  2. 在 `deploy.yml` 文件中添加以下内容：

      ```yaml
      name: Deploy Cloudflare Worker
      on:
        push:
          branches:
            - main
        schedule:
          - cron: "0 4,11 * * *"  # 世界协调时，相当于北京时间每天 12 点和 19 点各运行一次

      jobs:
        deploy:
          runs-on: ubuntu-latest
          steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Install create-cloudflare-cli
              run: npm install -g create-cloudflare-cli

            - name: Deploy Cloudflare Worker
              env:
                CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
                CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
                CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
              run: create-cloudflare-cli deploy
      ```

  3. 在 GitHub 仓库的 `Settings` -> `Secrets and variables` -> `Actions` 中添加以下 secrets：

      | Name                  | Value |
      | --------------------- | ----- |
      | CLOUDFLARE_API_TOKEN  | 从 Cloudflare 获取的 API Token |
      | CLOUDFLARE_ACCOUNT_ID | 从 Cloudflare 获取的 Account ID |
      | CLOUDFLARE_ZONE_ID    | 从 Cloudflare 获取的 Zone ID |

  4. 提交并推送更改到 GitHub 仓库的 `main` 分支，GitHub Actions 将自动运行并部署 Cloudflare Worker

## 注意事项

  1. 完美校园的智能水电偶尔会抽风，表现为手机 APP 无法进入相关页面，同时本脚本也无法查询相关信息。
  
  2. 本脚本消息推送功能使用的是[公共版 Qmsg 酱](https://qmsg.zendee.cn/docs/start/#%E5%85%AC%E5%85%B1%E7%89%88-%E6%8D%90%E8%B5%A0%E7%89%88-plus%E7%89%88-%E5%B7%AE%E5%BC%82)，消息推送数量上限为30条/天。 根据msg酱的作者的说法2022年不再支持qq信息推送（但是为什么我还能邀请msg酱进群呢）
  
  3. 若需修改定时执行频率或时间段，请在 Cloudflare Workers 控制台中修改 Cron Triggers 的设置。
  
  4. 桂电北海校区经[测试](https://github.com/zuwei522/perfect-campus_electricity-alert/actions/runs/5976106345/job/16213315269)可正常使用，其他学校暂不清楚能不能用。可在本仓库的 [Discussions](https://github.com/zuwei522/perfect-campus_electricity-alert/discussions/categories/%E5%90%84%E5%AD%A6%E6%A0%A1%E5%8F%AF%E7%94%A8%E6%80%A7%E5%88%86%E4%BA%AB) 分享你的或查看他人的测试结果。

      | Qmsg 推送消息 | 完美校园智能水电查询截图 |
      |:-:|:-:|
      | ![Qmsg消息截图](./images/Qmsg.png) | ![完美校园智能水电截图](./images/Screenshot_2023-08-26-00-01-13-621_com.newcapec.m.jpg) |

## 如果觉得不错，可以点个⭐Star 吗？

![求求你了](./images/求求你了.jpg)
