"use client";

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {Button, Typography, Spin, Progress, Input, App} from 'antd';
import {
    UploadOutlined,
    FileTextOutlined,
    DeleteOutlined,
    DownloadOutlined,
    SearchOutlined,
    FileImageOutlined,
    VideoCameraOutlined,
    AudioOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import {useAuth} from '@/contexts/AuthContext';
import {useRouter} from 'next/navigation';
import {docApi} from '@/services/api';
import {DocVO} from '@/types';
import {useChatStore} from '@/stores/chatStore'
import './page.css'

const {Title, Text} = Typography;
const {Search} = Input;

interface UploadedFile extends DocVO {
    status: 'uploading' | 'done' | 'error';
    percent?: number;
}

// 修改sidebarItems为函数，以便动态计算数量
const getSidebarItems = (fileCounts: { [key: string]: number }) => [
    {icon: AppstoreOutlined, label: '全部文件', key: 'all', count: fileCounts.all || 0},
    {icon: FileTextOutlined, label: '文档', key: 'doc', count: fileCounts.doc || 0},
    {icon: FileImageOutlined, label: '图片', key: 'image', count: fileCounts.image || 0},
    {icon: AudioOutlined, label: '语音', key: 'audio', count: fileCounts.audio || 0},
    {icon: VideoCameraOutlined, label: '视频', key: 'video', count: fileCounts.video || 0},
];

export default function FilesPage() {
    const {user, isLoading} = useAuth();
    const router = useRouter();
    const [fileList, setFileList] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchText, setSearchText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {currentCharacter} = useChatStore()
    const {message} = App.useApp();

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 获取文件类型
    const getFileType = (fileName: string): string => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt':
            case 'md':
                return 'doc';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'image';
            case 'mp3':
            case 'wav':
                return 'audio';
            case 'mp4':
            case 'avi':
                return 'video';
            default:
                return 'doc';
        }
    };

    // 获取文件图标
    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt':
            case 'md':
                return <FileTextOutlined className="text-2xl text-blue-500"/>;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <FileImageOutlined className="text-2xl text-green-500"/>;
            case 'mp3':
            case 'wav':
                return <AudioOutlined className="text-2xl text-purple-500"/>;
            case 'mp4':
            case 'avi':
                return <VideoCameraOutlined className="text-2xl text-red-500"/>;
            default:
                return <FileTextOutlined className="text-2xl text-gray-500"/>;
        }
    };

    // 加载文件列表
    const loadFiles = useCallback(async () => {
        if (!currentCharacter) {
            message.error('请选择一个角色');
            return;
        }
        try {
            const response = await docApi.list(currentCharacter.id);
            if (response.code === 200) {
                const filesWithStatus = response.data.map(file => ({
                    ...file,
                    status: 'h' as const
                }));
                setFileList(filesWithStatus);
            } else {
                message.error('加载文件列表失败: ' + response.message);
            }
        } catch (error) {
            message.error('加载文件列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setLoading(false);
        }
    }, [currentCharacter]);

    // 计算各类文件的数量
    const calculateFileCounts = (files: UploadedFile[]): { [key: string]: number } => {
        const counts: { [key: string]: number } = {
            all: files.length,
            doc: 0,
            image: 0,
            audio: 0,
            video: 0
        };

        files.forEach(file => {
            const fileType = getFileType(file.fileName);
            counts[fileType]++;
        });

        return counts;
    };

    useEffect(() => {
        if (user) {
            loadFiles();
        }
    }, [loadFiles, user]);

    if (isLoading || loading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                    <Spin size="large"/>
                </div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    // 根据活动类别过滤文件列表
    const filteredFileList = activeCategory === 'all'
        ? fileList
        : fileList.filter(file => getFileType(file.fileName) === activeCategory);

    // 处理文件上传
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        const newFile: UploadedFile = {
            id: 0,
            fileId: '',
            userId: 0,
            roleId: 0,
            fileUrl: '',
            fileName: file.name,
            fileSize: file.size,
            fileSizeFormatted: formatFileSize(file.size),
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            status: 'uploading',
            percent: 0
        };

        setFileList(prev => [...prev, newFile]);
        setUploading(true);

        try {
            const response = await docApi.upload(file, currentCharacter?.id);

            if (response.code === 200) {
                setFileList(prev => prev.map(f =>
                    f.fileName === newFile.fileName ? {...f, status: 'done', percent: 100} : f
                ));
                message.success(`${file.name} 上传成功`);
                await loadFiles();
            } else {
                setFileList(prev => prev.map(f =>
                    f.fileName === newFile.fileName ? {...f, status: 'error'} : f
                ));
                message.error(`${file.name} 上传失败: ${response.message}`);
            }
        } catch (error) {
            setFileList(prev => prev.map(f =>
                f.fileName === newFile.fileName ? {...f, status: 'error'} : f
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
    const handleDelete = async (fileId: string, fileName: string) => {
        try {
            const response = await docApi.delete(fileId);
            if (response.code === 200) {
                setFileList(prev => prev.filter(file => file.fileId !== fileId));
                message.success(`${fileName} 已删除`);
            } else {
                message.error(`删除失败: ${response.message}`);
            }
        } catch (error) {
            message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // 下载文件
    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await docApi.download(fileId);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                message.success(`${fileName} 开始下载`);
            } else {
                message.error('下载失败');
            }
        } catch (error) {
            message.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // 计算文件数量用于侧边栏
    const fileCounts = calculateFileCounts(fileList);

    return (
        <div className="file-root-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 md:p-6">
            <div className="flex mx-auto gap-6 h-full">
                {/* 左侧导航栏 */}
                <div className="hidden lg:block lg:w-1/3 xl:w-1/4 space-y-4">
                    {/* 文件分类 */}
                    <div
                        className="bg-white/70 backdrop-blur-xl h-full rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <Title level={4} className="m-0 text-gray-800">文件</Title>
                        </div>

                        <div className="space-y-2">
                            {getSidebarItems(fileCounts).map((item) => (
                                <div
                                    key={item.key}
                                    onClick={() => setActiveCategory(item.key)}
                                    className={`
                    flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300
                    ${activeCategory === item.key
                                        ? 'bg-gradient-to-br from-yellow-200 to-orange-100 shadow-[0_4px_16px_rgba(59,130,246,0.3)]'
                                        : 'hover:bg-white/60 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]'
                                    }
                  `}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`
                      p-2 rounded-xl`}>
                                            <item.icon
                                                className={`text-lg ${activeCategory === item.key ? 'text-white' : 'text-gray-600'}`}/>
                                        </div>
                                        <Text
                                            className={`font-medium ${activeCategory === item.key ? 'text-white' : 'text-gray-800'}`}>
                                            {item.label}
                                        </Text>
                                    </div>
                                    <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    
                  `}>
                                        {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧内容区 */}
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <div
                        className="bg-white/70 backdrop-blur-xl h-full md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 max-h-screen">
                        {/* 头部区域 */}
                        <div className="p-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl">
                                        <SearchOutlined className="text-xl text-gray-600"/>
                                    </div>
                                    <Search
                                        placeholder="搜索文件"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="w-full sm:w-80"
                                        style={{borderRadius: '16px'}}
                                    />
                                </div>

                                <div className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.txt,.md"
                                    />
                                    <Button
                                        type="primary"
                                        icon={<UploadOutlined/>}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 border-0 rounded-2xl px-6 shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-300"
                                    >
                                        上传
                                    </Button>
                                </div>
                            </div>

                            <Text type="secondary" className="text-sm">共 {filteredFileList.length} 项</Text>
                        </div>

                        {/* 文件列表头部 */}
                        <div className="px-6 py-4 border-b border-gray-100/50">
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                                <div className="col-span-6">文件</div>
                                <div className="col-span-3">创建时间</div>
                                <div className="col-span-2">大小</div>
                                <div className="col-span-1"></div>
                            </div>
                        </div>

                        {/* 文件列表 */}
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                            {filteredFileList.length === 0 && !uploading ? (
                                <div className="flex flex-col items-center justify-center" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                    <div className="bg-gray-50 p-8 rounded-3xl mb-6">
                                        <FileTextOutlined className="text-6xl text-gray-300"/>
                                    </div>
                                    <Text className="text-gray-500 text-lg mb-2">暂无上传文件</Text>
                                    <Text type="secondary">点击上传按钮开始上传您的第一个文件</Text>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredFileList.map((item, index) => (
                                        <div
                                            key={item.fileId || index}
                                            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300"
                                        >
                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-6 flex items-center space-x-4">
                                                    <div className="bg-white p-3 rounded-xl shadow-inner">
                                                        {getFileIcon(item.fileName)}
                                                    </div>
                                                    <div>
                                                        <Text
                                                            className="font-medium text-gray-800 block">{item.fileName}</Text>
                                                        {item.status === 'uploading' && item.percent !== undefined && (
                                                            <Progress percent={item.percent} size="small"
                                                                      className="mt-1"/>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-span-3">
                                                    <Text type="secondary" className="text-sm">
                                                        {new Date(item.createTime).toLocaleString('zh-CN', {
                                                            month: 'numeric',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false
                                                        }).replace(/\//g, '月').replace(' ', ' ')}前
                                                    </Text>
                                                </div>

                                                <div className="col-span-2">
                                                    <Text className="text-sm">{item.fileSizeFormatted}</Text>
                                                </div>

                                                <div className="col-span-1 flex items-center justify-end space-x-2">
                                                    {item.status === 'h' && (
                                                        <>
                                                            <Button
                                                                type="text"
                                                                icon={<DownloadOutlined/>}
                                                                onClick={() => handleDownload(item.fileId, item.fileName)}
                                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
                                                            />
                                                            <Button
                                                                type="text"
                                                                icon={<DeleteOutlined/>}
                                                                onClick={() => handleDelete(item.fileId, item.fileName)}
                                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                            />
                                                        </>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <div
                                                            className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                                                            上传失败
                                                        </div>
                                                    )}
                                                    {item.status === 'done' && (
                                                        <div
                                                            className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                                                            完成
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}