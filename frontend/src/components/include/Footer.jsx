import React from 'react';

const Footer = () => {
 console.log("Footer Loaded!");

  return (
    <footer className="bg-white mt-auto">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Footer Sections */}
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-medium mb-4 text-black">회사 소개</h4>
            <p className="text-black">SUPPLE IT은 신뢰할 수 있는 영양제 정보를 제공하는 플랫폼입니다.</p>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-black">고객 지원</h4>
            <ul className="space-y-2">
              {['자주 묻는 질문', '1:1 문의', '공지사항'].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className="text-black hover:text-teal-500">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-black">법적 고지</h4>
            <ul className="space-y-2">
              {['이용약관', '개인정보 처리방침'].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className="text-black hover:text-teal-500">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-black">연락처</h4>
            <ul className="space-y-2">
              {[
                { icon: 'fa-phone', text: '02–1234–5678' },
                { icon: 'fa-envelope', text: 'support@suppleit.com' },
                { icon: 'fa-map-marker-alt', text: '서울특별시 강남구 테헤란로 123' },
              ].map((contact, idx) => (
                <li key={idx} className="text-black">
                  <i className={`fas ${contact.icon} mr-2`}></i> {contact.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-center text-sm text-black">© 2025 SUPPLE IT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
