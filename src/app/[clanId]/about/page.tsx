import { BookOpen, Users, Phone } from "lucide-react";
import { getClanMeta } from "@/lib/clans";

export default function AboutPage({ params }: { params: { clanId: string } }) {
  const clanId = params.clanId;
  const meta = getClanMeta(clanId);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">关于本谱</h1>
        <p className="text-sm text-gray-500 mt-1">{meta.name}编修历程与信息</p>
      </div>

      {/* 谱牒简介 */}
      <div className="card space-y-4">
        <h2 className="chinese-heading text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={18} className="text-primary-500" />
          {meta.name}简介
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            {meta.region}，始迁祖{meta.rootName}。{meta.rootIntro}
          </p>
        </div>
      </div>

      {clanId === "chen" ? (
        <>
          {/* 编委会（陈氏专属） */}
          <div className="card space-y-4">
            <h2 className="chinese-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-primary-500" />
              续谱编委会（2013年）
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">会长</div>
                <div className="text-gray-600">陈章彦</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">秘书长</div>
                <div className="text-gray-600">陈章明A</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">顾问</div>
                <div className="text-gray-600">陈章明</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">总编辑 / 程序化</div>
                <div className="text-gray-600">陈安波</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-1">成员</p>
              <p>安业、安国、安忠、安栋、安良、安红、安智</p>
            </div>
          </div>

          {/* 续修说明（陈氏专属） */}
          <div className="card space-y-3">
            <h2 className="chinese-heading text-lg font-bold text-gray-900">续修计划</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>· 三十年小编，六十年大编出版</p>
              <p>· 十年一汇稿，以免重名</p>
              <p>· 本谱以公元纪年为主，不排除使用农历</p>
              <p>· 宗谱不对外出卖，入谱光荣，不得入谱可耻</p>
            </div>
          </div>
        </>
      ) : clanId === "zhao" ? (
        <>
          {/* 重修谱序（赵氏专属） */}
          <div className="card space-y-4">
            <h2 className="chinese-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-primary-500" />
              赵氏重修谱序
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                自古迄今国家有史，宗族有谱，史载国事，谱以源考支派维系之重。我族赵氏原籍湖北麻城。但始祖里居名目先进无传，后进无闻，世远年湮，无有考征于其不知。故自之举公生：必林昆仲有三，父子兄弟自郧移自徙洵地生涯，依钓船江竿为业。其中二人走散，俱失其详。唯必林得利鱼舟，创业于小棕溪汉江北岸樊家坡方止居住。传及世义、世湖、世玉、世龙四弟兄又移居大棕溪西沟山岔左手进沟杜家庄、历有数年，所生文、武、雾、云、雨、芳、才诸人。后迁吕家槽沟口居住。人兴财旺，日见繁衍。但名目本源，支派尊卑生殁坟茔均无考证。为此合族商议：恭请夏清绪先生于同治壬辰年新修赵氏宗谱。至今百年之久，沧桑巨变，生死濒数。族人居住分散。若不重修宗谱势必支派难辨、尊卑难分、生殁无记。为此在本族十一世后裔济仓热诚倡议，积极支持，并举荐知识渊博、德高望重的长者赵崇永先生负责执笔，共同重修宗谱一事。
              </p>
              <p>
                本次修谱是在老谱基础上的延续。其一，将近数十年生殁未入谱的查实支系，不论有无生殁年庚，按支系将名目入谱；其二，按支系由前至后顺序排列，以便查阅；其三，根据现实删去了数条戒律，增添了几条温馨提示，希族人共勉之；其四，生殁时间以一九四九年十月一日以前按朝代记，以后按公历计算。
              </p>
              <p>
                本次笔修程序是：先逐户调查，走访登记，再列草册核对后交由济仓负责打印装订成本。为合族之全书，属我族之巨典。自此本源清晰，尊卑有序，名目详实，生殁有记。祖德宗功，子荣孙贵，世世千秋发达，支支万代兴隆。是为序。
              </p>
            </div>
          </div>

          {/* 温馨提示（赵氏专属） */}
          <div className="card space-y-3">
            <h2 className="chinese-heading text-lg font-bold text-gray-900">温馨提示</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>一、我合族应恪守自强、自立、自尊、自爱为立业之本。遵纪守法，以耕读勤奋为本，讲道德促和谐与时俱进。</p>
              <p>二、弘扬中华千年美德，孝顺父母，力戒忤逆，做到侍父母能竭其力。孝顺乃齐家之本。</p>
              <p>三、讲道德促和谐，力戒兹事生非，打架斗殴，酗酒闹事，参与赌博、家庭暴力等邪恶蛮横行为。大力弘扬团结和谐之新风尚。</p>
              <p>四、发扬团结友爱、平等待人的美德，力戒以强欺弱、以富欺贫、以尊欺卑的恶习。发扬扶弱济贫、尊老爱幼、和平处世之公民美德。</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>重修宗谱执笔先生：赵崇永</p>
              <p>二零一四年二月二十八日</p>
            </div>
          </div>
        </>
      ) : (
        <div className="card space-y-3">
          <h2 className="chinese-heading text-lg font-bold text-gray-900">编修说明</h2>
          <div className="text-sm text-gray-700 leading-relaxed space-y-2">
            <p>· 本谱资料由家族成员提供并整理</p>
            <p>· 宗谱不对外出卖</p>
          </div>
        </div>
      )}

      {/* 联系信息 */}
      <div className="card space-y-3">
        <h2 className="chinese-heading text-lg font-bold text-gray-900 flex items-center gap-2">
          <Phone size={18} className="text-primary-500" />
          联系方式
        </h2>
        <div className="space-y-1 text-sm text-gray-600">
          <p>如需联系谱务组或反馈信息，请在「{meta.name}」微信群里联系。</p>
        </div>
      </div>
    </div>
  );
}