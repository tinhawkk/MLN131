export type StageQuestion = {
  id: string;
  prompt: string;
  options?: string[];
  correctAnswer: number | number[] | string | string[];
  durationSeconds: number;
  explanation?:
    | string
    | {
        correct: string;
        incorrect: string;
      };
};

export type StoryStage = {
  step: number;
  title: string;
  focus: string;
  intro: string;
  hostSituation: string;
  knowledgeSummary: string;
  outro: string;
  concept: string;
  questions: StageQuestion[];
};

export const STORY_STAGES: StoryStage[] = [
  {
    step: 2,
    title: "CHẶNG 1: MÀN SƯƠNG THÔNG TIN - QUYỀN LỰC BẮT ĐẦU TỪ SỰ THẬT",
    focus: "Dân biết",
    intro:
      "[MÂU THUẪN] Sáng sớm, máy xúc lù lù tiến vào cày nát bãi hoa màu đầu thôn Yên Bình. Người dân tá hỏa chạy ra ngăn cản. Trưởng thôn lạnh lùng rút ra một tờ quyết định thu hồi đất: 'Xã đã duyệt dự án Khu công nghiệp sinh thái, dán thông báo ở trụ sở từ tháng trước, ai không đọc ráng chịu!'. Nhưng khi dân kéo lên trụ sở, tờ thông báo bị dán khuất góc cầu thang, mờ tịt, không rõ phương án đền bù, không rõ ai là chủ đầu tư. Chính quyền đang coi người dân là 'đối tượng bị quản lý' chứ không phải 'chủ thể của quyền lực'!",
    hostSituation:
      "Màn hình hiện ra tờ thông báo nhem nhuốc và tiếng ồn ào phẫn nộ của người dân. Host nhấn mạnh: 'Trong nền dân chủ XHCN, sự bưng bít thông tin là hành vi tước đoạt quyền lực của nhân dân'. Các nhóm có 30 giây để phá vỡ bức tường quan liêu này bằng cách dùng luật để ép chính quyền phải minh bạch!",
    knowledgeSummary:
      "Tuyệt vời! Các bạn đã buộc chính quyền phải công khai toàn bộ dự án. Dân chủ không phải là thứ được ban phát, dân chủ bắt đầu từ việc người dân nắm được thông tin để làm chủ vận mệnh của mình.",
    outro:
      "Bản quy hoạch chi tiết 1/500 và phương án đền bù đã được gửi đến từng nhà. Ánh sáng của sự minh bạch đã xua tan màn sương quan liêu.",
    concept:
      "Theo Chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh, Dân chủ (Demokratia) có nghĩa là 'Quyền lực thuộc về nhân dân'. Để thực thi quyền lực, điều kiện tiên quyết là nhân dân phải được cung cấp thông tin minh bạch ('Dân biết'). Bưng bít thông tin là biểu hiện của sự tha hóa quyền lực nhà nước.",
    questions: [
      {
        id: "1.1",
        prompt:
          "Theo giáo trình CNXHKH, bản chất của việc trưởng thôn giấu giếm thông tin dự án, dán thông báo đối phó là biểu hiện của căn bệnh gì làm xói mòn nền dân chủ?",
        options: [
          "Bệnh giáo điều, rập khuôn theo tư bản.",
          "Bệnh quan liêu, xa rời quần chúng, tước đoạt quyền làm chủ của dân.",
          "Bệnh chủ quan duy ý chí trong phát triển kinh tế.",
          "Bệnh cục bộ, hẹp hòi địa phương."
        ],
        correctAnswer: 1,
        durationSeconds: 30, // Đã tăng thời gian
        explanation:
          "Việc bưng bít thông tin là biểu hiện rõ nhất của 'bệnh quan liêu' - khi cán bộ coi mình là 'quan cách mạng' đứng trên nhân dân, thay vì là 'công bộc' của dân. Điều này đi ngược lại bản chất Nhà nước XHCN.",
      },
      {
        id: "1.2",
        prompt:
          "Trong nấc thang dân chủ ở cơ sở, tại sao 'Dân biết' lại là mắt xích đầu tiên và mang tính sống còn?",
        options: [
          "Vì luật pháp quốc tế quy định quyền tiếp cận thông tin.",
          "Để người dân không khiếu kiện vượt cấp gây mất trật tự.",
          "Vì thông tin là cơ sở để hình thành tư duy độc lập. Không có thông tin, nhân dân không thể 'bàn', 'làm' hay 'giám sát' chính quyền.",
          "Vì đó là quy định bắt buộc của các cơ quan kiểm toán độc lập."
        ],
        correctAnswer: 2,
        durationSeconds: 45, // Đã tăng thời gian vì option dài
        explanation:
          "Quyền lực của nhân dân là giả tạo nếu họ bị mù mờ về thông tin. 'Dân biết' là tiền đề vật chất và tinh thần để các bước dân chủ tiếp theo được thực thi thực chất.",
      },
      {
        id: "1.3",
        prompt:
          "Người dân phát hiện phương án đền bù không thỏa đáng. Theo quy chế Dân chủ ở cơ sở, để phản kháng lại quyết định áp đặt này một cách hợp pháp, người dân phải làm gì?",
        options: [
          "Biểu tình chặn máy xúc để gây áp lực.",
          "Yêu cầu Chủ tịch xã tổ chức ngay Hội nghị nhân dân để đối thoại công khai.",
          "Đăng bài lên mạng xã hội bêu rếu cán bộ xã.",
          "Cam chịu vì quyết định của cấp trên là tuyệt đối không thể thay đổi."
        ],
        correctAnswer: 1,
        durationSeconds: 30, // Đã tăng thời gian
        explanation:
          "Dân chủ XHCN là dân chủ pháp quyền. Việc yêu cầu đối thoại công khai qua Hội nghị nhân dân là công cụ pháp lý mạnh mẽ nhất để nhân dân thực thi quyền làm chủ trực tiếp của mình tại cơ sở.",
      },
    ],
  },
  {
    step: 3,
    title: "CHẶNG 2: NÚT THẮT ĐỒNG THUẬN - BẢN LĨNH CỦA SỐ ĐÔNG VÀ THIỂU SỐ",
    focus: "Dân bàn",
    intro:
      "[ĐIỂM NGOẶT CĂNG THẲNG] Hội nghị nhân dân diễn ra nảy lửa. Dự án Khu công nghiệp sẽ mang lại việc làm cho 80% thanh niên trong xã. NHƯNG, nó yêu cầu phải san lấp 'Khu ao đầm tâm linh' - nơi gắn với tín ngưỡng lâu đời và sinh kế của 20% hộ dân làm nghề chài lưới. Phía doanh nghiệp ép tiến độ: 'Đa số 80% đồng ý rồi, cứ thế mà san lấp, 20% kia phải phục tùng!'. Những người chài lưới chuẩn bị gậy gộc để tử thủ bảo vệ ao đầm. Dân chủ không phải là 'vua tập thể' dùng số đông để chà đạp số ít!",
    hostSituation:
      "Host chiếu hình ảnh cán cân chao đảo: Một bên là sự phát triển kinh tế của đa số (80%) - Một bên là sinh kế và văn hóa của thiểu số (20%). Nếu dùng bạo lực áp đặt, đó là 'độc tài của đa số' - không phải dân chủ XHCN. Các đội có 45 giây để tìm ra phương án 'Tập trung dân chủ' để giải quyết bài toán này.",
    knowledgeSummary:
      "Chính xác! Dân chủ XHCN ưu việt ở chỗ: Lấy quyết định theo đa số nhưng TÔN TRỌNG và TÌM GIẢI PHÁP BẢO VỆ thiểu số. Xã đã quyết định điều chỉnh quy hoạch, giữ lại 1/3 ao đầm và hỗ trợ chuyển đổi nghề cho dân chài.",
    outro:
      "Căng thẳng hạ nhiệt. Không có máu đổ, không có người bị bỏ lại phía sau. Nghị quyết mới được thông qua với sự đồng thuận 100%. Đó mới là sức mạnh thực sự của 'Dân bàn'.",
    concept:
      "Bản chất của dân chủ XHCN không chỉ là quy tắc 'thiểu số phục tùng đa số' (Nguyên tắc tập trung dân chủ), mà còn là việc giải quyết hài hòa các quan hệ lợi ích (cá nhân - tập thể - xã hội). Dân chủ XHCN từ chối sự áp đặt tàn nhẫn của đa số lên lợi ích hợp pháp của thiểu số.",
    questions: [
      {
        id: "2.1",
        prompt:
          "Lý lẽ '80% đồng ý rồi, cứ đưa máy xúc vào ủi 20% còn lại' của doanh nghiệp vi phạm nghiêm trọng bản chất nào của Dân chủ XHCN?",
        options: [
          "Bản chất chính trị: Quyền lực thuộc về nhân dân nhưng phải được thực thi qua pháp luật, không dùng bạo lực áp bức đồng bào.",
          "Bản chất kinh tế: Phải chia đều tiền đền bù cho tất cả mọi người.",
          "Bản chất văn hóa: Không được động đến các yếu tố tâm linh.",
          "Bản chất xã hội: Cào bằng mọi sự khác biệt về lợi ích trong cộng đồng."
        ],
        correctAnswer: 0,
        durationSeconds: 45, // Tăng lên 45s vì đáp án khá dài
        explanation:
          "Khác với dân chủ tư sản (nơi kẻ mạnh/số đông có thể chà đạp kẻ yếu hợp pháp), dân chủ XHCN mang bản chất nhân văn: bảo vệ quyền lợi chính đáng của mọi tầng lớp nhân dân lao động, tìm kiếm sự đồng thuận chứ không phải sự áp chế.",
      },
      {
        id: "2.2",
        prompt:
          "Để thực hiện đúng tinh thần 'Dân bàn', quy trình nào sau đây thể hiện rõ nhất quyền làm chủ trực tiếp của nhân dân đối với dự án tác động tới cộng đồng?",
        options: [
          "Chủ tịch xã tự quyết định rồi thông báo trên đài phát thanh.",
          "Tổ chức lấy ý kiến, bàn bạc công khai, bỏ phiếu biểu quyết và phương án đền bù phải được đa số nhân dân đồng thuận mới được triển khai.",
          "Mời thầy phong thủy về xem ngày giờ san lấp ao đầm.",
          "Giao toàn quyền quyết định cho doanh nghiệp vì họ là người bỏ vốn đầu tư."
        ],
        correctAnswer: 1,
        durationSeconds: 45, // Tăng thời gian
        explanation:
          "'Dân bàn' không phải là tranh luận cho vui. 'Bàn' phải dẫn đến 'Quyết định' bằng biểu quyết (quyền lực trực tiếp). Sự đồng thuận của nhân dân là tính chính danh cao nhất của mọi chính sách.",
      },
      {
        id: "2.3",
        prompt:
          "Việc chính quyền điều chỉnh lại dự án, hy sinh một phần diện tích khu công nghiệp để giữ lại sinh kế cho nhóm 20% dân chài lưới thể hiện việc giải quyết tốt mối quan hệ cốt lõi nào trong CNXHKH?",
        options: [
          "Mối quan hệ giữa cơ sở hạ tầng và kiến trúc thượng tầng.",
          "Việc giải quyết hài hòa mối quan hệ lợi ích: Cá nhân - Tập thể - Xã hội.",
          "Mối quan hệ giữa Đảng lãnh đạo và Nhà nước quản lý.",
          "Mối quan hệ giữa lực lượng sản xuất và quan hệ sản xuất."
        ],
        correctAnswer: 1,
        durationSeconds: 30, // 30s là vừa đẹp cho câu này
        explanation:
          "Dân chủ XHCN luôn hướng tới sự công bằng. Giải quyết hài hòa lợi ích là cách duy nhất để tạo ra sự đoàn kết toàn dân - động lực chính để xây dựng chủ nghĩa xã hội.",
      },
    ],
  },
  {
    step: 4,
    title: "CHẶNG 3: NHỮNG KẺ CẮP QUYỀN LỰC - DÂN LÀM & DÂN KIỂM TRA",
    focus: "Dân làm, Dân kiểm tra, giám sát",
    intro:
      "[BIẾN CỐ LỚN] Khu công nghiệp bắt đầu xây dựng nhà máy xử lý nước thải. Nhưng đêm đêm, người dân ngửi thấy mùi hôi nồng nặc sặc mùi hóa chất. Nhóm thanh niên thôn bí mật phục kích, quay được cảnh nhà thầu đang lắp đặt một đường ống xả thải ngầm đâm thẳng ra con sông sinh hoạt của xã! Khi dân báo cáo, Chủ tịch xã (có cổ phần ngầm trong công ty) gạt đi: 'Họ làm đúng thiết kế kỹ thuật, dân đen biết gì mà kiểm tra!'. Quyền lực nhà nước đang bị nhóm lợi ích thao túng!",
    hostSituation:
      "Host hiển thị video xả thải trộm mờ ảo trong đêm và thái độ hách dịch của viên Chủ tịch xã. Cảnh báo đỏ: Quyền lực nhà nước đang tha hóa! Nhân dân không thể ngồi chờ 'bề trên' rủ lòng thương. Các bạn có 30 giây để kích hoạt vũ khí tối thượng của nền dân chủ cơ sở!",
    knowledgeSummary:
      "Đòn phản công xuất sắc! Dân làng đã lập Ban Giám sát đầu tư cộng đồng, thu thập bằng chứng và gửi đơn tố cáo thẳng lên Cảnh sát Môi trường cấp Tỉnh. Đường ống ngầm bị phá dỡ, Chủ tịch xã bị đình chỉ công tác. Nhân dân đã dùng 'quyền giám sát' để phẫu thuật cắt bỏ khối u tham nhũng khỏi bộ máy Nhà nước.",
    outro:
      "Dòng sông đã trong xanh trở lại. Bài học đắt giá: Nhà nước là của dân, nhưng nếu dân lơ là, bộ máy nhà nước rất dễ bị tha hóa thành công cụ của nhóm lợi ích.",
    concept:
      "Theo Lênin, nguy cơ lớn nhất của đảng cầm quyền và nhà nước vô sản là 'bệnh quan liêu' và 'xa rời quần chúng'. 'Dân kiểm tra, dân giám sát' chính là cơ chế tự bảo vệ của nền dân chủ XHCN, nơi nhân dân trực tiếp kiểm soát quyền lực nhà nước, ngăn chặn sự tha hóa, tham nhũng.",
    questions: [
      {
        id: "3.1",
        prompt:
          "Câu nói của viên Chủ tịch xã: 'Dân đen biết gì mà kiểm tra!' phản ánh sự vi phạm nghiêm trọng nguyên lý nào của Nhà nước pháp quyền XHCN?",
        options: [
          "Tất cả quyền lực nhà nước thuộc về nhân dân; cơ quan nhà nước chỉ là nơi được nhân dân 'ủy quyền'.",
          "Nhà nước là một bộ máy cai trị độc lập, đứng trên xã hội.",
          "Trí thức mới có quyền quản lý nhà nước, nông dân chỉ lo sản xuất.",
          "Nhà nước là công cụ chuyên chính chỉ để bảo vệ lợi ích của những người có chức quyền."
        ],
        correctAnswer: 0,
        durationSeconds: 45, 
        explanation:
          "Trong CNXHKH, bộ máy nhà nước không có quyền lực tự thân. Quyền lực của cán bộ là do nhân dân ủy thác. Việc cán bộ khinh miệt người dân là sự tước đoạt ngược lại quyền lực của người chủ thực sự.",
      },
      {
        id: "3.2",
        prompt:
          "Hành động người dân chủ động quay phim, thu thập bằng chứng xả thải ngầm và làm đơn tố cáo thể hiện hình thức dân chủ nào?",
        options: [
          "Dân chủ đại diện (thông qua hội đồng nhân dân).",
          "Dân chủ trực tiếp (nhân dân tự mình thực hiện quyền giám sát tổ chức, cá nhân thực thi quyền lực).",
          "Dân chủ cực đoan, vô chính phủ.",
          "Dân chủ hình thức (chỉ có trên giấy tờ)."
        ],
        correctAnswer: 1,
        durationSeconds: 30,
        explanation:
          "Giám sát và khiếu nại tố cáo là hình thức cao nhất của Dân chủ trực tiếp. Nhân dân không cần thông qua người đại diện mà trực tiếp sử dụng công cụ pháp luật để bảo vệ lợi ích chung.",
      },
      {
        id: "3.3",
        prompt:
          "Việc Chủ tịch xã bị cách chức và phải chịu trách nhiệm trước pháp luật vì bao che sai phạm chứng minh đặc trưng nào của Nhà nước pháp quyền XHCN?",
        options: [
          "Sự tự tiêu vong của bộ máy Nhà nước.",
          "Tính giai cấp công nhân sâu sắc.",
          "Tính thượng tôn pháp luật: Bất kỳ ai lạm dụng quyền lực được nhân dân giao phó đều bị nghiêm trị, không có vùng cấm.",
          "Tính quốc tế của giai cấp vô sản."
        ],
        correctAnswer: 2,
        durationSeconds: 45,
        explanation:
          "Nhà nước pháp quyền XHCN quản lý xã hội bằng pháp luật. Quyền lực phải được kiểm soát bằng quyền lực (pháp luật) và sự giám sát tối cao của nhân dân. Sự trừng phạt cán bộ tha hóa chính là cách Nhà nước bảo vệ bản chất 'của dân, do dân, vì dân'.",
      },
    ],
  },
  {
    step: 5,
    title: "CHẶNG 4: CÁNH CỔNG THỤ HƯỞNG - ĐÍCH ĐẾN CỦA CHỦ NGHĨA XÃ HỘI",
    focus: "Dân thụ hưởng",
    intro:
      "[HÁI QUẢ NGỌT] Hai năm sau cơn bão tham nhũng. Khu công nghiệp sinh thái đi vào hoạt động trơn tru, dòng sông vẫn trong vắt tôm cá. Trẻ em Yên Bình được đi học miễn phí từ quỹ phúc lợi của khu công nghiệp. Quan trọng hơn, người dân Yên Bình giờ đây ngẩng cao đầu. Cán bộ xã làm việc với thái độ kính trọng dân, vì họ biết: Mắt dân rất sáng! Sự thụ hưởng ở đây vượt xa những đồng tiền đền bù vật chất.",
    hostSituation:
      "Màn hình rực sáng với hình ảnh nhịp sống thanh bình, giàu có của Yên Bình. Host đặt vấn đề mang tính tổng kết: Hành trình đấu tranh của chúng ta đã đi đến đích. Nhưng 'Thụ hưởng' trong CNXHKH thực chất là gì? Hãy chứng minh các bạn đã hiểu thấu đáo bản chất của bộ môn này qua 3 câu hỏi cuối cùng!",
    knowledgeSummary:
      "Tuyệt vời! Các bạn đã hiểu đúng đích đến của Chủ nghĩa xã hội khoa học. Dân chủ không phải là một khẩu hiệu chính trị suông. Dân chủ phải dẫn đến sự giải phóng con người, mang lại ấm no, tự do và hạnh phúc thực sự.",
    outro:
      "Cánh cổng Yên Bình đã mở toang. Bài học về dân chủ cơ sở không chỉ nằm trong sách vở, nó là nhịp thở của thực tiễn. Khi nhân dân thực sự nắm quyền, mọi phép màu đều có thể xảy ra!",
    concept:
      "'Dân thụ hưởng' là khâu cuối cùng và cũng là mục đích tối thượng của nền dân chủ XHCN. Nó phản ánh bản chất nhân văn của CNXH: Mọi sự phát triển kinh tế, chính trị, văn hóa cuối cùng phải quay về phục vụ cho sự phát triển toàn diện, tự do và hạnh phúc của con người.",
    questions: [
      {
        id: "4.1",
        prompt:
          "Sự khác biệt lớn nhất về khái niệm 'Thụ hưởng' giữa nền dân chủ tư sản và nền dân chủ XHCN (như kết quả tại thôn Yên Bình) là gì?",
        options: [
          "Dân chủ tư sản: Thụ hưởng tập trung vào nhóm thiểu số nắm tư liệu sản xuất. Dân chủ XHCN: Thụ hưởng là của đại đa số nhân dân lao động.",
          "Dân chủ tư sản không có sự thụ hưởng vật chất, chỉ có dân chủ XHCN mới có.",
          "Dân chủ XHCN bắt buộc mọi người thụ hưởng bằng nhau tuyệt đối, cào bằng không phân biệt đóng góp.",
          "Cả hai nền dân chủ đều có mức độ thụ hưởng vật chất và tinh thần hoàn toàn giống nhau đối với mọi giai cấp."
        ],
        correctAnswer: 0,
        durationSeconds: 45, // Tăng lên 45s vì đáp án hơi dài
        explanation:
          "Bản chất giai cấp của nền dân chủ XHCN là nền dân chủ của tuyệt đại đa số. Mọi thành quả của sự phát triển (vật chất và quyền lực) không bị thâu tóm bởi giới tinh hoa tư bản, mà được phân phối công bằng cho nhân dân.",
      },
      {
        id: "4.2",
        prompt:
          "Việc người dân Yên Bình 'ngẩng cao đầu', cảm thấy được cán bộ tôn trọng và ý thức rõ quyền làm chủ của mình phản ánh khía cạnh thụ hưởng nào trong CNXH?",
        options: [
          "Thụ hưởng về mặt kinh tế (tăng thu nhập).",
          "Thụ hưởng về mặt chính trị - tinh thần (sự giải phóng con người, có vị thế làm chủ xã hội).",
          "Thụ hưởng về mặt sinh thái (môi trường sạch).",
          "Thụ hưởng về mặt ngoại giao (mở rộng giao lưu quốc tế)."
        ],
        correctAnswer: 1,
        durationSeconds: 30,
        explanation:
          "Mục tiêu cao nhất của CNXH do Mác - Ăngghen vạch ra là 'giải phóng con người'. Thụ hưởng lớn nhất của nhân dân là thoát khỏi thân phận bị áp bức, trị vì, trở thành người chủ thực sự của đất nước và vận mệnh mình.",
      },
      {
        id: "4.3",
        prompt:
          "Toàn bộ hành trình tại thôn Yên Bình là một vòng tròn khép kín của nền dân chủ trực tiếp. Hãy nhập thật chính xác 6 từ khóa (6 động từ) quy định quyền lực của nhân dân theo tinh thần Đại hội XIII của Đảng (Cách nhau bằng dấu phẩy):\n\nDân ..., Dân ..., Dân ..., Dân ..., Dân ..., Dân ...",
        correctAnswer: [
          "biết",
          "bàn",
          "làm",
          "kiểm tra",
          "giám sát",
          "thụ hưởng",
        ],
        durationSeconds: 75, // Tăng vọt lên 75s để sinh viên kịp gõ 6 từ
        explanation:
          "BIẾT (Sự minh bạch là tiền đề) -> BÀN (Tập trung dân chủ, tạo đồng thuận) -> LÀM (Trực tiếp hành động) -> KIỂM TRA, GIÁM SÁT (Chống tha hóa quyền lực nhà nước) -> THỤ HƯỞNG (Mục đích cuối cùng là giải phóng con người). Thiếu bất kỳ mắt xích nào, quyền lực của nhân dân đều bị đe dọa!",
      },
    ],
  },
];

export const STAGE_STEP_SET = new Set(STORY_STAGES.map((stage) => stage.step));

export function normalizeAnswerText(value: string) {
  return value.toLowerCase().trim();
}