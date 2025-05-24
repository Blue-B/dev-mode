import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  "https://nujgcyryhvogafapepyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51amdjeXJ5aHZvZ2FmYXBlcHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3OTg0NTgsImV4cCI6MjA2MzM3NDQ1OH0.PMN8j92B3UngKfIwj9Gp5hq9TnsyF6Nv_SBhm3T3JAY"
);

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthNumber: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    profile_image: ''
  });

  // 구글 로그인으로부터 전달받은 정보 처리
  useEffect(() => {
    const initializeFormData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;

        if (user) {
          setIsGoogleUser(true);
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            profile_image: user.user_metadata.avatar_url || ''
          }));
        } else if (location.state) {
          setIsGoogleUser(true);
          setFormData(prev => ({
            ...prev,
            email: location.state.email || '',
            profile_image: location.state.profile_image || ''
          }));
        }
      } catch (error) {
        console.error('사용자 정보 초기화 에러:', error);
      }
    };

    initializeFormData();
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isGoogleUser) {
        // 일반 회원가입
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                name: formData.name,
                birth_number: formData.birthNumber,
                gender: formData.gender,
                phone: formData.phone,
                address: formData.address,
              },
            ]);

          if (profileError) throw profileError;
        }
      } else {
        // 구글 로그인 사용자 프로필 업데이트
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name: formData.name,
              birth_number: formData.birthNumber,
              gender: formData.gender,
              phone: formData.phone,
              address: formData.address,
              profile_image: formData.profile_image
            },
          ]);

        if (profileError) throw profileError;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const pageVariants = {
      initial: {
        opacity: 0,
        x: 50,
        scale: 0.95
      },
      animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      },
      exit: {
        opacity: 0,
        x: -50,
        scale: 0.95,
        transition: {
          duration: 0.3,
          ease: "easeIn"
        }
      }
    };

    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-6">기본 정보를 입력해주세요</h2>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-left text-gray-600 mb-1">이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                  required
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-left text-gray-600 mb-1">생년월일</label>
                <input
                  type="text"
                  name="birthNumber"
                  value={formData.birthNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="YYYYMMDD"
                  required
                />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200"
              >
                다음
              </button>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-6">성별과 전화번호를 입력해주세요</h2>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-left text-gray-600 mb-2">성별</label>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                    className={`px-8 py-3 rounded-full font-semibold transition duration-200 ${
                      formData.gender === 'male'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                    className={`px-8 py-3 rounded-full font-semibold transition duration-200 ${
                      formData.gender === 'female'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    여성
                  </button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-left text-gray-600 mb-1">전화번호</label>
              <input
                type="tel"
                name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01012345678"
                  required
                />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200"
              >
                다음
              </button>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-6">주소를 입력해주세요</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="서울시 강남구"
                required
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200"
              >
                다음
              </button>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-6">입력하신 정보를 확인해주세요</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-xl p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-600">이름</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">생년월일</span>
                <span className="font-medium">{formData.birthNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">성별</span>
                <span className="font-medium">{formData.gender === 'male' ? '남성' : '여성'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">전화번호</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">주소</span>
                <span className="font-medium">{formData.address}</span>
            </div>
              {isGoogleUser && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium">{formData.email}</span>
            </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4"
            >
              <p className="text-gray-600">입력하신 정보가 모두 맞나요?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleBack}
                  className="bg-gray-100 text-gray-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition duration-200"
                >
                  수정하기
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200"
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '가입하기'}
            </button>
        </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full relative">
        {currentStep > 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={handleBack}
            className="absolute -top-12 left-0 bg-gray-100 text-gray-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            이전
          </motion.button>
        )}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Signup;
