"use client";

import React, { useState, useRef } from 'react';
import { message, Button, Card, List, Typography, Spin, Progress } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { docApi } from '@/services/api';

const { Title, Text } = Typography;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  percent?: number;
}

export default function FilesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查用户是否已登录
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    // 创建文件记录
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      status: 'uploading',
      percent: 0
    };

    // 添加到文件列表
    setFileList(prev => [...prev, newFile]);
    setUploading(true);

    try {
      // 调用实际的上传API
      const response = await docApi.upload(file);
      
      if (response.code === 0) {
        // 上传完成
        setFileList(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'done', percent: 100 } : f
        ));
        message.success(`${file.name} 上传成功`);
      } else {
        // 上传失败
        setFileList(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'error' } : f
        ));
        message.error(`${file.name} 上传失败: ${response.message}`);
      }
    } catch (error) {
      // 网络错误等异常
      setFileList(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'error' } : f
      ));
      message.error(`${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除文件
  const handleDelete = (id: string) => {
    setFileList(prev => prev.filter(file => file.id !== id));
    message.success('文件已删除');
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm mb-6">
          <Title level={2} className="text-center mb-2 text-gray-800">文件管理</Title>
          <Text type="secondary" className="block text-center mb-6">上传和管理您的文档文件</Text>
          
          {/* 上传区域 */}
          <div className="mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-6 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-95"
              size="large"
            >
              {uploading ? '上传中...' : '选择文件上传'}
            </Button>
            <Text type="secondary" className="block text-center mt-2">
              支持 PDF, DOC, DOCX, TXT, MD 格式
            </Text>
          </div>

          {/* 文件列表 */}
          {fileList.length > 0 && (
            <div>
              <Title level={4} className="mb-4 text-gray-700">已上传文件</Title>
              <List
                dataSource={fileList}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        icon={<DownloadOutlined />} 
                        key="download"
                        onClick={() => message.info('下载功能将在后续版本中实现')}
                      >
                        下载
                      </Button>,
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />} 
                        key="delete"
                        danger
                        onClick={() => handleDelete(item.id)}
                      >
                        删除
                      </Button>
                    ]}
                    className="bg-white rounded-xl shadow-sm p-4 mb-2 border border-white/30"
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined className="text-2xl text-blue-500" />}
                      title={
                        <div>
                          <Text className="font-medium">{item.name}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {formatFileSize(item.size)}
                          </Text>
                        </div>
                      }
                    />
                    <div className="flex items-center">
                      {item.status === 'uploading' && item.percent !== undefined && (
                        <Progress percent={item.percent} size="small" className="w-32" />
                      )}
                      {item.status === 'done' && (
                        <Text type="success">上传完成</Text>
                      )}
                      {item.status === 'error' && (
                        <Text type="danger">上传失败</Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          {fileList.length === 0 && !uploading && (
            <div className="text-center py-12">
              <FileTextOutlined className="text-6xl text-gray-300 mb-4" />
              <Text className="block text-gray-500">暂无上传文件</Text>
            </div>
          )}
        </Card>

        {/* 说明信息 */}
        <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <Title level={4} className="text-gray-800">使用说明</Title>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>上传的文件将用于与AI角色进行更智能的对话</li>
            <li>支持多种文档格式，包括PDF、Word、TXT等</li>
            <li>文件上传后会自动进行内容解析和向量化处理</li>
            <li>您可以在对话中引用已上传的文件内容</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}