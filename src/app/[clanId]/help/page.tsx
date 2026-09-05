import Link from "next/link";
import {
  BookOpen,
  Search,
  Trees,
  BarChart3,
  UserPlus,
  PlusCircle,
  ShieldCheck,
  HelpCircle,
  FileText,
} from "lucide-react";
import { getClanMeta } from "@/lib/clans";

export default function HelpPage({ params }: { params: { clanId: string } }) {
  const clanId = params.clanId;
  const meta = getClanMeta(clanId);
  const prefix = `/${clanId}`;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* 页头 */}
      <div className="text-center py-4">
        <h1 className="chinese-heading text-3xl font-bold text-gray-900 mb-2">用户手册</h1>
        <p className="text-gray-500">{meta.name}网站使用说明</p>
        <p className="text-sm text-gray-400 mt-1">
          chenmike.cn{prefix} · 始迁祖{meta.rootName} · {meta.branches.length} 房支
        </p>
      </div>

      {/* 目录 */}
      <nav className="card">
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <FileText size={16} className="text-primary-600" />
          目录
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-primary-700">
          <li><a href="#one" className="hover:text-primary-500">一、网站能做什么</a></li>
          <li><a href="#two" className="hover:text-primary-500">二、浏览族谱（无需注册）</a></li>
          <li><a href="#three" className="hover:text-primary-500">三、注册与登录</a></li>
          <li><a href="#four" className="hover:text-primary-500">四、提交信息变更</a></li>
          <li><a href="#five" className="hover:text-primary-500">五、我的记录</a></li>
          <li><a href="#feedback" className="hover:text-primary-500">六、意见反馈</a></li>
          <li><a href="#six" className="hover:text-primary-500">七、管理员审核</a></li>
          <li><a href="#seven" className="hover:text-primary-500">八、常见问题（FAQ）</a></li>
          <li><a href="#eight" className="hover:text-primary-500">九、技术支持</a></li>
        </ol>
      </nav>

      {/* 一 */}
      <section id="one" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">一</span>
          网站能做什么
        </h2>
        <div className="card">
          <p className="text-sm text-gray-600 mb-4">
            {meta.name}网站是{meta.region}家族线上族谱，为族人提供五大功能：
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">功能</th>
                  <th className="py-2 pr-4 font-medium">是否需要登录</th>
                  <th className="py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4">浏览族谱</td><td className="py-2.5 pr-4 text-green-600">不需要</td><td className="py-2.5">家谱树、族人详情、文献、统计</td></tr>
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4">搜索族人</td><td className="py-2.5 pr-4 text-green-600">不需要</td><td className="py-2.5">按姓名模糊搜索，快速定位</td></tr>
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4">提交信息变更</td><td className="py-2.5 pr-4 text-amber-600">需要注册登录</td><td className="py-2.5">新生、结婚、去世信息提交</td></tr>
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4">意见反馈</td><td className="py-2.5 pr-4 text-amber-600">需要注册登录</td><td className="py-2.5">向谱务组反馈信息与建议</td></tr>
                <tr><td className="py-2.5 pr-4">管理员审核</td><td className="py-2.5 pr-4 text-amber-600">需要管理员密码</td><td className="py-2.5">审核族人提交的变更与反馈</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-primary-700 bg-primary-50 rounded-lg px-3 py-2 mt-4">
            重要提示：仅浏览家谱信息无需注册，直接访问即可查看；注册是为了提交族人信息更新。
          </p>
        </div>
      </section>

      {/* 二 */}
      <section id="two" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">二</span>
          浏览族谱（无需注册）
        </h2>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5"><Trees size={16} className="text-primary-500" />家谱树</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-2">
              <li><span className="font-medium text-gray-700">树形</span>：从始祖「{meta.rootName}」开始逐代展开，点击节点前的箭头展开子孙</li>
              <li><span className="font-medium text-gray-700">列表</span>：按世代分组，逐代列出，一目了然</li>
              <li>页内可搜索族人姓名快速定位</li>
              <li>点击任意人名进入「人物详情」</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1">人物详情</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-2">
              <li>基本信息：姓名、性别、第几代、所属房支、排行</li>
              <li>配偶信息</li>
              <li>生平记载：生卒、安葬地、子女等（摘自族谱原文）</li>
              <li>祖先路径：页面顶部面包屑导航可逐级返回</li>
              <li>子女列表：点击子女直接跳转到其详情</li>
              <li>部分人物有照片（本人 / 配偶），点击可放大查看</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5"><Search size={16} className="text-primary-500" />族人搜索</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-2">
              <li>输入姓名即可模糊搜索</li>
              <li>结果展示世代、房支、配偶及祖先路径，点击进入详情</li>
              <li>全谱共收录 800 余人</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5"><BarChart3 size={16} className="text-primary-500" />统计分析</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-2">
              <li>总览卡片：总人数、男性、女性、传承代数</li>
              <li>世代人口分布柱状图（每代男女数量）</li>
              <li>男女比例饼图</li>
              <li>各房支人口统计</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5"><BookOpen size={16} className="text-primary-500" />家族文献</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-2">
              <li>谱序、规条、家训、派行等</li>
              <li>点击文献卡片展开 / 收起全文</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 三 */}
      <section id="three" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">三</span>
          注册与登录
        </h2>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5"><UserPlus size={16} className="text-primary-500" />为什么要注册</h3>
            <p className="text-sm text-gray-600">注册后才能<Link href={`${prefix}/submit`} className="text-primary-600 hover:text-primary-500">提交族人信息变更</Link>（新生、结婚、去世）。仅浏览无需注册。</p>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">注册步骤</h3>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1.5">
              <li>点击右上角「登录 / 注册」，切到「注册」标签页</li>
              <li>填写<strong>手机号</strong>（11位）并获取短信验证码</li>
              <li>填写<strong>你在族谱中的姓名</strong>、<strong>父亲姓名</strong>、<strong>母亲姓名</strong></li>
              <li>设置密码（至少 6 位）</li>
              <li>提交注册</li>
            </ol>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">登录</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>手机号 + 密码 登录</li>
              <li>登录后即可进入「提交信息变更」页面</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 四 */}
      <section id="four" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">四</span>
          提交信息变更
        </h2>
        <div className="card">
          <p className="text-sm text-gray-600 mb-4">
            登录后点击「提交变更」，可提交三类信息，提交后进入<strong>待审核</strong>状态：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="font-bold text-gray-800 mb-1">新生</p>
              <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                <li>新生儿姓名、性别</li>
                <li>出生日期、出生时间、出生地</li>
                <li>父亲、母亲姓名</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="font-bold text-gray-800 mb-1">结婚</p>
              <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                <li>新郎、新娘姓名</li>
                <li>新娘出生日期</li>
                <li>结婚日期</li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="font-bold text-gray-800 mb-1">去世</p>
              <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                <li>逝者姓名</li>
                <li>去世日期、享年</li>
                <li>安葬地</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">提交时可填备注补充说明。提交后信息需管理员审核通过才正式生效。</p>
        </div>
      </section>

      {/* 五 */}
      <section id="five" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">五</span>
          我的记录
        </h2>
        <div className="card">
          <p className="text-sm text-gray-600 mb-3">「我的记录」页面展示你本人提交过的全部变更及其状态：</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">状态</th>
                  <th className="py-2 font-medium">含义</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4 text-amber-600">待审核</td><td className="py-2.5">已提交，等待管理员审核</td></tr>
                <tr className="border-b border-gray-100"><td className="py-2.5 pr-4 text-green-600">已通过</td><td className="py-2.5">审核通过，信息有效</td></tr>
                <tr><td className="py-2.5 pr-4 text-red-600">已驳回</td><td className="py-2.5">审核未通过，可查看原因后重新提交</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 六 反馈 */}
      <section id="feedback" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">六</span>
          意见反馈
        </h2>
        <div className="card space-y-3">
          <p className="text-sm text-gray-600">登录后点击导航「反馈」，可向谱务组提交反馈信息或建议，例如：</p>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>发现族谱信息有误</li>
            <li>对网站功能有改进建议</li>
            <li>其他需要谱务组处理的事项</li>
          </ul>
          <p className="text-sm text-gray-600">提交后显示「待回复」状态；管理员查看并回复后，状态变为「已回复」，并可在「我的反馈」中查看回复内容。</p>
        </div>
      </section>

      {/* 七 */}
      <section id="six" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">七</span>
          管理员审核
        </h2>
        <div className="card space-y-4">
          <div className="bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-700">
            管理员入口仅供谱务管理人员使用。
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1.5 flex items-center gap-1.5"><ShieldCheck size={16} className="text-primary-500" />进入方式</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
              <li>登录页切换到「管理员」标签页</li>
              <li>输入管理员密码</li>
              <li>进入「管理后台」页面</li>
            </ol>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1.5">审核操作</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>「变更审核」标签页默认显示待审核，可切换查看：待审核 / 已通过 / 已驳回</li>
              <li>对每条待审核记录点「通过」或「驳回」</li>
              <li>审核通过的信息由管理员定期合并入族谱母本</li>
              <li>「反馈管理」标签页可查看族人反馈（待回复 / 已回复 / 全部），并可回复反馈</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 八 */}
      <section id="seven" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">八</span>
          常见问题（FAQ）
        </h2>
        <div className="space-y-3">
          {[
            ["需要注册才能看家谱吗？", "不需要。浏览家谱树、搜索、文献、统计均免费开放，无需登录。"],
            ["注册时提示\"姓名与族谱不一致\"怎么办？", "请核对：① 姓名是否含错别字，应与族谱记载完全一致；② 父亲、母亲姓名是否正确；③ 若是配偶（族谱记\"妻/配\"），请用丈夫姓名注册；④ 仍无法注册请在「" + meta.name + "」群里联系谱务组协助。"],
            ["提交的信息多久生效？", "提交后进入待审核，管理员审核通过后生效。可随时在「我的记录」查看进度。"],
            ["信息填错了能改吗？", "暂不支持在线修改，请重新提交一条正确记录，或在群里联系谱务组处理。"],
            ["短信验证码收不到？", "当前短信服务尚未开通，验证码会直接显示在页面上（模拟验证码），自动填入即可。正式开通短信后按手机接收。"],
            ["手机浏览器能用吗？", "可以。网站为响应式设计，手机、平板、电脑均可正常使用。"],
            ["可以在微信里打开吗？", "可以，将网址转发到微信聊天即可点击打开。"],
            ["如何联系谱务组？", "请在「" + meta.name + "」微信群里联系。"],
          ].map(([q, a]) => (
            <div key={q} className="card">
              <p className="font-medium text-gray-900 mb-1 flex items-start gap-1.5">
                <HelpCircle size={16} className="text-primary-500 shrink-0 mt-0.5" />
                {q}
              </p>
              <p className="text-sm text-gray-600">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 九 */}
      <section id="eight" className="scroll-mt-20">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm shrink-0">九</span>
          技术支持
        </h2>
        <div className="card text-sm text-gray-600 space-y-1.5">
          <p>技术支持：陈安波</p>
          <p>联系谱务组：在「{meta.name}」微信群里联系</p>
          <p>网站域名：https://chenmike.cn{prefix}</p>
          <p className="text-xs text-gray-400 pt-2">本手册随网站同步更新，如有疑问请与谱务组联系。</p>
        </div>
      </section>
    </div>
  );
}