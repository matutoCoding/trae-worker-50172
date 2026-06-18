export default defineAppConfig({
  pages: [
    'pages/seats/index',
    'pages/schedule/index',
    'pages/queue/index',
    'pages/mine/index',
    'pages/seat-detail/index',
    'pages/booking-edit/index',
    'pages/cycle-rule/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '静学自习室',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F9FB'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2BA471',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/seats/index',
        text: '座位排期'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '周期预约'
      },
      {
        pagePath: 'pages/queue/index',
        text: '排队叫号'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
